import os
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Union
from uuid import uuid4
from pymongo import MongoClient
from abc import ABC, abstractmethod

class IStorage(ABC):
    @abstractmethod
    def get_user(self, user_id: str) -> Optional[Dict]:
        pass
    
    @abstractmethod
    def get_user_by_username(self, username: str) -> Optional[Dict]:
        pass
    
    @abstractmethod
    def create_user(self, user_data: Dict) -> Dict:
        pass
    
    @abstractmethod
    def track_visitor(self, visitor_data: Dict) -> Dict:
        pass
    
    @abstractmethod
    def get_visitor_counts(self, period: Optional[str] = None) -> Dict:
        pass
    
    @abstractmethod
    def get_all_visitors(self) -> List[Dict]:
        pass

class JSONFileStorage(IStorage):
    def __init__(self, data_file_path: str = "data/visitors_data.json"):
        self.data_file_path = data_file_path
        self.data = {"users": [], "visitors": []}
        self._load_data()
    
    def _ensure_data_directory(self):
        os.makedirs(os.path.dirname(self.data_file_path), exist_ok=True)
    
    def _load_data(self):
        try:
            self._ensure_data_directory()
            with open(self.data_file_path, 'r') as f:
                self.data = json.load(f)
                if "users" not in self.data:
                    self.data["users"] = []
                if "visitors" not in self.data:
                    self.data["visitors"] = []
        except (FileNotFoundError, json.JSONDecodeError):
            self.data = {"users": [], "visitors": []}
            self._save_data()
    
    def _save_data(self):
        try:
            self._ensure_data_directory()
            with open(self.data_file_path, 'w') as f:
                json.dump(self.data, f, indent=2, default=str)
        except Exception as e:
            print(f"Error saving data to JSON file: {e}")
    
    def get_user(self, user_id: str) -> Optional[Dict]:
        for user in self.data["users"]:
            if user.get("id") == user_id:
                return user
        return None
    
    def get_user_by_username(self, username: str) -> Optional[Dict]:
        for user in self.data["users"]:
            if user.get("username") == username:
                return user
        return None
    
    def create_user(self, user_data: Dict) -> Dict:
        user = {
            "id": str(uuid4()),
            "username": user_data["username"],
            "password": user_data["password"]
        }
        self.data["users"].append(user)
        self._save_data()
        return user
    
    def track_visitor(self, visitor_data: Dict) -> Dict:
        visitor = {
            "id": str(uuid4()),
            "userId": visitor_data.get("userId"),
            "page": visitor_data["page"],
            "referrer": visitor_data.get("referrer"),
            "userAgent": visitor_data.get("userAgent"),
            "ip": visitor_data.get("ip"),
            "timestamp": datetime.utcnow().isoformat()
        }
        self.data["visitors"].append(visitor)
        self._save_data()
        return visitor
    
    def get_all_visitors(self) -> List[Dict]:
        return self.data["visitors"]
    
    def get_visitor_counts(self, period: Optional[str] = None) -> Dict:
        now = datetime.utcnow()
        
        start_of_today = datetime(now.year, now.month, now.day)
        start_of_week = now - timedelta(days=now.weekday())
        start_of_week = datetime(start_of_week.year, start_of_week.month, start_of_week.day)
        start_of_month = datetime(now.year, now.month, 1)
        start_of_year = datetime(now.year, 1, 1)
        
        visitors = self.data["visitors"]
        
        def count_since(start_date):
            count = 0
            for v in visitors:
                try:
                    timestamp = datetime.fromisoformat(v["timestamp"].replace("Z", "+00:00"))
                    if timestamp >= start_date:
                        count += 1
                except:
                    pass
            return count
        
        counts = {
            "today": count_since(start_of_today),
            "week": count_since(start_of_week),
            "month": count_since(start_of_month),
            "year": count_since(start_of_year)
        }
        
        if period:
            return {period: counts.get(period, 0)}
        
        return counts

class MongoDBStorage(IStorage):
    def __init__(self, connection_string: str):
        self.client = MongoClient(connection_string)
        self.db = self.client["visitors_analytics"]
        self.initialized = False
    
    def initialize(self):
        if not self.initialized:
            self.client.admin.command('ping')
            self.initialized = True
            print("Connected to MongoDB successfully")
    
    def get_user(self, user_id: str) -> Optional[Dict]:
        self.initialize()
        user = self.db.users.find_one({"id": user_id})
        if user:
            user.pop("_id", None)
        return user
    
    def get_user_by_username(self, username: str) -> Optional[Dict]:
        self.initialize()
        user = self.db.users.find_one({"username": username})
        if user:
            user.pop("_id", None)
        return user
    
    def create_user(self, user_data: Dict) -> Dict:
        self.initialize()
        user = {
            "id": str(uuid4()),
            "username": user_data["username"],
            "password": user_data["password"]
        }
        self.db.users.insert_one(user.copy())
        return user
    
    def track_visitor(self, visitor_data: Dict) -> Dict:
        self.initialize()
        visitor = {
            "id": str(uuid4()),
            "userId": visitor_data.get("userId"),
            "page": visitor_data["page"],
            "referrer": visitor_data.get("referrer"),
            "userAgent": visitor_data.get("userAgent"),
            "ip": visitor_data.get("ip"),
            "timestamp": datetime.utcnow()
        }
        self.db.visitors.insert_one(visitor.copy())
        return visitor
    
    def get_all_visitors(self) -> List[Dict]:
        self.initialize()
        visitors = list(self.db.visitors.find({}))
        for v in visitors:
            v.pop("_id", None)
        return visitors
    
    def get_visitor_counts(self, period: Optional[str] = None) -> Dict:
        self.initialize()
        now = datetime.utcnow()
        
        start_of_today = datetime(now.year, now.month, now.day)
        start_of_week = now - timedelta(days=now.weekday())
        start_of_week = datetime(start_of_week.year, start_of_week.month, start_of_week.day)
        start_of_month = datetime(now.year, now.month, 1)
        start_of_year = datetime(now.year, 1, 1)
        
        if period:
            start_dates = {
                "today": start_of_today,
                "week": start_of_week,
                "month": start_of_month,
                "year": start_of_year
            }
            start_date = start_dates.get(period)
            if start_date:
                count = self.db.visitors.count_documents({"timestamp": {"$gte": start_date}})
                return {period: count}
            return {period: 0}
        
        counts = {
            "today": self.db.visitors.count_documents({"timestamp": {"$gte": start_of_today}}),
            "week": self.db.visitors.count_documents({"timestamp": {"$gte": start_of_week}}),
            "month": self.db.visitors.count_documents({"timestamp": {"$gte": start_of_month}}),
            "year": self.db.visitors.count_documents({"timestamp": {"$gte": start_of_year}})
        }
        
        return counts

def get_storage() -> IStorage:
    mongodb_uri = os.getenv("MONGODB_URI")
    if mongodb_uri:
        return MongoDBStorage(mongodb_uri)
    return JSONFileStorage()

storage = get_storage()
