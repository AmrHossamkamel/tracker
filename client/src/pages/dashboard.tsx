import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { VisitorAnalytics, VisitorCounts } from "@shared/schema";

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch visitor counts
  const { data: analyticsData, isLoading, error } = useQuery<VisitorAnalytics>({
    queryKey: ['/api/visitors/count', selectedPeriod !== "all" ? `?period=${selectedPeriod}` : ""],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Track visitor mutation
  const trackVisitorMutation = useMutation({
    mutationFn: async (visitorData: any) => {
      const response = await apiRequest("POST", "/api/visitors/track", visitorData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Visitor Tracked",
        description: "Visitor has been successfully recorded",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/visitors/count'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to track visitor",
        variant: "destructive",
      });
    }
  });

  // Track current page visit on component mount
  useEffect(() => {
    trackVisitorMutation.mutate({
      page: window.location.pathname,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    });
  }, []);

  const handleFetchData = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/visitors/count'] });
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getStatsData = (): VisitorCounts => {
    if (!analyticsData?.data) {
      return { today: 0, week: 0, month: 0, year: 0 };
    }
    
    const data = analyticsData.data as any;
    
    // If specific period was requested, fill in with 0s for missing periods
    if (selectedPeriod !== "all") {
      return {
        today: data.today || 0,
        week: data.week || 0,
        month: data.month || 0,
        year: data.year || 0,
      };
    }
    
    return data as VisitorCounts;
  };

  const stats = getStatsData();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-primary-foreground text-sm"></i>
                </div>
                <h1 className="text-xl font-semibold text-foreground">Visitor Analytics API</h1>
              </div>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="#overview" className="text-muted-foreground hover:text-foreground transition-colors">Overview</a>
              <a href="#demo" className="text-muted-foreground hover:text-foreground transition-colors">Live Demo</a>
              <a href="#documentation" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</a>
              <a href="#dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</a>
            </nav>
            <button className="md:hidden p-2 rounded-md hover:bg-accent">
              <i className="fas fa-bars text-muted-foreground"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="overview" className="py-16 bg-gradient-to-b from-background to-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Track Your Website Visitors
            <span className="text-primary"> Effortlessly</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Simple REST API for tracking and analyzing website visitor data with real-time counts for daily, weekly, monthly, and yearly periods.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#demo" className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
              <i className="fas fa-play-circle mr-2"></i>
              Try Live Demo
            </a>
            <a href="#documentation" className="inline-flex items-center px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium">
              <i className="fas fa-book mr-2"></i>
              View Documentation
            </a>
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section id="demo" className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">Live Demo</h3>
            <p className="text-muted-foreground">Test the API endpoint and see real visitor data</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* API Tester */}
            <div className="bg-background rounded-lg border border-border p-6">
              <h4 className="text-xl font-semibold mb-4 flex items-center">
                <i className="fas fa-terminal text-primary mr-2"></i>
                API Tester
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Endpoint</label>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-primary text-primary-foreground font-mono">GET</Badge>
                    <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono">/api/visitors/count</code>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Parameters</label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod} data-testid="select-period">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select time period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                      <SelectItem value="all">All Periods</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleFetchData}
                  disabled={isLoading}
                  className="w-full"
                  data-testid="button-fetch-data"
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Fetching...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane mr-2"></i>
                      Get Visitor Count
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Response Display */}
            <div className="bg-background rounded-lg border border-border p-6">
              <h4 className="text-xl font-semibold mb-4 flex items-center">
                <i className="fas fa-code text-chart-2 mr-2"></i>
                API Response
              </h4>
              
              <div className="code-block p-4 min-h-[200px] bg-slate-900 rounded">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : error ? (
                  <pre className="text-sm text-red-400 font-mono" data-testid="text-error">
                    {JSON.stringify({ 
                      status: "error", 
                      message: "Failed to fetch data",
                      error: error.message 
                    }, null, 2)}
                  </pre>
                ) : (
                  <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap" data-testid="text-response">
                    {JSON.stringify(analyticsData, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section id="dashboard" className="py-16 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">Visitor Analytics Dashboard</h3>
            <p className="text-muted-foreground">Real-time visitor statistics and trends</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="stat-today">
                      {isLoading ? <Skeleton className="h-8 w-16" /> : formatNumber(stats.today)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-chart-1/10 rounded-full flex items-center justify-center">
                    <i className="fas fa-calendar-day text-chart-1"></i>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-chart-1 font-medium">Real-time</span>
                  <span className="text-muted-foreground ml-1">live data</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="stat-week">
                      {isLoading ? <Skeleton className="h-8 w-16" /> : formatNumber(stats.week)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-chart-2/10 rounded-full flex items-center justify-center">
                    <i className="fas fa-calendar-week text-chart-2"></i>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-chart-2 font-medium">Weekly</span>
                  <span className="text-muted-foreground ml-1">aggregate</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="stat-month">
                      {isLoading ? <Skeleton className="h-8 w-16" /> : formatNumber(stats.month)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-chart-3/10 rounded-full flex items-center justify-center">
                    <i className="fas fa-calendar-alt text-chart-3"></i>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-chart-3 font-medium">Monthly</span>
                  <span className="text-muted-foreground ml-1">growth</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">This Year</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="stat-year">
                      {isLoading ? <Skeleton className="h-8 w-16" /> : formatNumber(stats.year)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-chart-4/10 rounded-full flex items-center justify-center">
                    <i className="fas fa-calendar text-chart-4"></i>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-chart-4 font-medium">Yearly</span>
                  <span className="text-muted-foreground ml-1">total</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Placeholder */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <h4 className="text-lg font-semibold mb-4">Visitor Trends</h4>
              <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <i className="fas fa-chart-line text-4xl text-muted-foreground mb-2"></i>
                  <p className="text-muted-foreground">Chart visualization would be implemented here</p>
                  <p className="text-sm text-muted-foreground mt-1">Using libraries like Chart.js or D3.js</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* API Documentation */}
      <section id="documentation" className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">API Documentation</h3>
            <p className="text-muted-foreground">Complete reference for implementing visitor tracking</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Endpoints */}
            <div className="lg:col-span-2 space-y-8">
              {/* Get Visitor Count */}
              <Card className="bg-background border-border">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Badge className="bg-primary text-primary-foreground font-mono">GET</Badge>
                    <h4 className="text-lg font-semibold">/api/visitors/count</h4>
                  </div>
                  <p className="text-muted-foreground mb-4">Retrieve visitor counts for specified time periods</p>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium mb-2">Query Parameters</h5>
                      <div className="bg-muted/30 rounded p-3 text-sm">
                        <div className="grid grid-cols-3 gap-4 font-medium text-muted-foreground border-b border-border pb-2 mb-2">
                          <span>Parameter</span>
                          <span>Type</span>
                          <span>Description</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 py-1">
                          <code className="text-primary">period</code>
                          <span className="text-muted-foreground">string</span>
                          <span className="text-muted-foreground">today, week, month, year, all</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">Example Request</h5>
                      <div className="code-block p-3 bg-slate-900 rounded">
                        <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
{`curl -X GET "https://your-api.com/api/visitors/count?period=today" \\
  -H "Content-Type: application/json"`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Track Visitor */}
              <Card className="bg-background border-border">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Badge className="bg-chart-2 text-white font-mono">POST</Badge>
                    <h4 className="text-lg font-semibold">/api/visitors/track</h4>
                  </div>
                  <p className="text-muted-foreground mb-4">Record a new visitor to your website</p>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium mb-2">Request Body</h5>
                      <div className="code-block p-3 bg-slate-900 rounded">
                        <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
{`{
  "user_id": "optional_user_identifier",
  "page": "/home",
  "referrer": "https://google.com",
  "user_agent": "Mozilla/5.0...",
  "ip": "192.168.1.1"
}`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">Example Response</h5>
                      <div className="code-block p-3 bg-slate-900 rounded">
                        <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
{`{
  "status": "success",
  "message": "Visitor tracked successfully",
  "visitor_id": "v_1642248600_abc123"
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Reference */}
            <div className="space-y-6">
              <Card className="bg-background border-border">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4 flex items-center">
                    <i className="fas fa-info-circle text-primary mr-2"></i>
                    Quick Reference
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">Base URL:</span>
                      <code className="block text-primary mt-1">https://your-api.com/api</code>
                    </div>
                    <div>
                      <span className="font-medium">Authentication:</span>
                      <span className="block text-muted-foreground mt-1">API Key (optional)</span>
                    </div>
                    <div>
                      <span className="font-medium">Rate Limit:</span>
                      <span className="block text-muted-foreground mt-1">1000 requests/hour</span>
                    </div>
                    <div>
                      <span className="font-medium">Response Format:</span>
                      <span className="block text-muted-foreground mt-1">JSON</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background border-border">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4 flex items-center">
                    <i className="fas fa-code text-chart-2 mr-2"></i>
                    HTTP Status Codes
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <code className="text-chart-2">200</code>
                      <span className="text-muted-foreground">Success</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="text-chart-4">400</code>
                      <span className="text-muted-foreground">Bad Request</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="text-chart-1">429</code>
                      <span className="text-muted-foreground">Rate Limited</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="text-destructive">500</code>
                      <span className="text-muted-foreground">Server Error</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background border-border">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-4 flex items-center">
                    <i className="fas fa-download text-chart-3 mr-2"></i>
                    Implementation
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">Add visitor tracking to your website:</p>
                  <div className="code-block p-3 bg-slate-900 rounded">
                    <pre className="text-xs text-gray-300 font-mono overflow-x-auto">
{`// JavaScript Integration
fetch('/api/visitors/track', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    page: window.location.pathname
  })
});`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/20 border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-muted-foreground">
              © 2024 Visitor Analytics API. Built for modern web applications.
            </p>
            <div className="mt-4 flex justify-center space-x-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <i className="fab fa-github"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <i className="fas fa-book"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <i className="fas fa-envelope"></i>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
