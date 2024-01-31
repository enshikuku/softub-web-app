# Softub Web App

Softub Web App is an e-commerce website built with Node.js and Express, featuring functionalities for users to browse products, add them to the cart, and place orders. Users can register, log in, and view their dashboard. Admins have access to features like adding, editing, activating/deactivating products, and viewing messages.

## Features

- Browse products
- Add products to the cart
- Place orders
- User registration and login
- Admin dashboard
- Add, edit, and activate/deactivate products
- View messages and orders

## Technologies Used

- Node.js
- Express.js
- MySQL
- Express-session
- Bcrypt
- Multer
- Dotenv
- Nodemailer

## Setup and Installation

1. Clone the repository:

```bash
git clone https://github.com/enshikuku/softub-web-app.git
```

2. Navigate to the project directory:

```bash
cd softub-web-app
```

3. Install dependencies:

```bash
npm install
```

4. Set up the database by following the instructions in [DATABASE_CREATION.md](DATABASE_CREATION.md).

5. Create a `.env` file and add the following environment variables:

```
ADMINPIN=your_admin_pin
```

6. Run the server:

```bash
npm start
```

7. Access the application in your browser at `http://localhost:9000`.

## Usage

- Browse products: Visit the homepage to view featured products.
- Add products to the cart: Navigate to the shop page and click on "Add to Cart" for the desired products.
- Place orders: View your cart, adjust quantities if needed, and proceed to checkout.
- User registration: Click on "Register" to create an account.
- User login: Log in using your credentials.
- Admin dashboard: Accessible at `/dashboard` after logging in as an admin.
- Add, edit, and activate/deactivate products: Manage products from the admin dashboard.

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## License

This project is licensed under the [MIT License](LICENSE).
