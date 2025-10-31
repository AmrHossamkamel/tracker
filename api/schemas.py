from marshmallow import Schema, fields, validate, ValidationError

class TrackVisitorSchema(Schema):
    userId = fields.Str(required=False, allow_none=True)
    page = fields.Str(required=True, validate=validate.Length(min=1))
    referrer = fields.Str(required=False, allow_none=True)
    userAgent = fields.Str(required=False, allow_none=True)
    ip = fields.Str(required=False, allow_none=True)

track_visitor_schema = TrackVisitorSchema()
