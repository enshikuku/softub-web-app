Create the database
```sql
CREATE DATABASE softhub
```

Create table product
```sql
CREATE TABLE product (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
  	image VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```