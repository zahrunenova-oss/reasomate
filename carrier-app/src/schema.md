# ReasoMate Data Schema

## Data Models

### User
```json
{
  "id": "string (nanoid)",
  "handle": "string",
  "sigil": "string (optional)",
  "created_at": "number (timestamp)"
}
```

### Pulse
```json
{
  "id": "string (nanoid)",
  "user_id": "string",
  "body": "string",
  "tag": "any (optional)",
  "created_at": "number (timestamp)"
}
```

### Message
```json
{
  "id": "string (nanoid)",
  "thread_id": "string",
  "from_id": "string",
  "to_id": "string",
  "body": "string",
  "created_at": "number (timestamp)"
}
```

### Thread
```json
{
  "id": "string (nanoid)",
  "a_id": "string (user_id)",
  "b_id": "string (user_id)",
  "last_at": "number (timestamp)"
}
```

## Database Structure
```json
{
  "users": [],
  "pulses": [],
  "messages": [],
  "threads": []
}
```