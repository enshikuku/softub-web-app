Create the database
```sql
CREATE DATABASE softhub
```
-- Create 'product' table
```sql
CREATE TABLE product (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    image VARCHAR(255),
    price VARCHAR(255),
    isactive VARCHAR(10) DEFAULT 'active',
    timestamp TIMESTAMP
);

```

-- Create 'user' table
```sql
CREATE TABLE user (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    isactive VARCHAR(10) DEFAULT 'active',
    timestamp TIMESTAMP
);
```