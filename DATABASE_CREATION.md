# Database Creation Script

This script contains SQL statements to create the following tables:

## Message Table

```sql
CREATE TABLE message (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    email VARCHAR(255),
    subject VARCHAR(255),
    message TEXT,
    timestamp TIMESTAMP,
    isactive VARCHAR(20) DEFAULT 'active'
);
```

## Newsletter Table

```sql
CREATE TABLE newsletter (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255),
    timestamp TIMESTAMP,
    isactive VARCHAR(20) DEFAULT 'active'
);
```

## Product Table

```sql
CREATE TABLE product (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    image VARCHAR(255),
    price VARCHAR(50),
    isactive VARCHAR(20) DEFAULT 'active',
    timestamp TIMESTAMP
);
```

## User Table

```sql
CREATE TABLE user (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    isactive VARCHAR(20) DEFAULT 'active',
    timestamp TIMESTAMP
);
```

## ShopSession Table

```sql
CREATE TABLE shopsession (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cartid VARCHAR(50),
    productid VARCHAR(50),
    quantity INT,
    isactive VARCHAR(20) DEFAULT 'active',
    FOREIGN KEY (productid) REFERENCES product(id)
);
```