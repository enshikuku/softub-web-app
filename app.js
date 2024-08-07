import express from 'express'
import mysql from 'mysql'
import session from 'express-session'
import bcrypt from 'bcrypt'
import multer from 'multer'
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'


const app = express()

const ca = fs.readFileSync(path.resolve(process.cwd(), "ca.pem"))


const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        ca: ca,
    }
})

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/productimage')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})

const upload = multer({ storage: storage })

dotenv.config()
let ADMINPIN = process.env.ADMINPIN

app.set('view engine', 'ejs')

app.use(express.static('public'))

app.use(express.urlencoded({ extended: false }))

app.use(express.json())

app.use(session({
    secret: 'softubhub',
    saveUninitialized: false,
    resave: true
}))

app.use((req, res, next) => {
    res.locals.isLogedIn = (req.session.userID !== undefined)
    next()
})

const config = {
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'softubhub@gmail.com',
        pass: 'hmdgoknsbkonlztn'
    }
}

const sendEmail = (data) => {
    const transporter = nodemailer.createTransport(config)
    transporter.sendMail(data, (err, info) => {
        if (err) {
            console.error('Error sending email:', err)
        } else {
            console.log('Email sent:', info.response)
        }
    })
}

const generateOrderConfirmationEmail = (order) => {
    const cartItemsText = order.cartItems.map(cartItem => `
        Product: ${cartItem.name}
        Quantity: ${cartItem.quantity}
        Price: $${cartItem.price * cartItem.quantity}
        -------------------------
    `).join('')

    return {
        from: 'softubhub@gmail.com',
        to: order.email,
        subject: 'Your Softtubhub Order Received!',
        text: `
            Thank you for your order!
            Our team will contact you to confirm shipment, payment, and delivery details. Before then, please review and confirm your order:
            Details:
            Name: ${order.name}
            Email: ${order.email}
            Address: ${order.address}
            Total: $${order.total}
            Cart Items:
            ${cartItemsText}
            
            If any of these details are incorrect, please email us immediately at softubhub@gmail.com.
        `
    }
}

const generateMessageNotificationEmail = (name, email, subject, message) => {
    return {
        from: 'softubhub@gmail.com',
        to: 'softubhub@gmail.com',
        subject: 'New Message Received',
        text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`
    }
}

function loginRequired(req, res) {
    res.locals.isLogedIn || res.redirect('/login')
}

function generateid() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const randomCharacters = Array.from({ length: 10 }, () => characters.charAt(Math.floor(Math.random() * characters.length)))
    const genID = randomCharacters.join('')
    return genID
}

function checkIfIdExists(id, sql) {
    connection.query(sql, [id], (error, results) => {
        if (results.length > 0) {
            return true
        } else {
            return false
        }
    })
}

app.get('/', (req, res) => {
    let sql = 'SELECT * FROM product  WHERE isactive = ? LIMIT 5'
    connection.query(
        sql,['active'], (err, products) => {
            res.render('index', {products: products})
        }
    )
})

app.get('/shop', (req, res) => {
    let table = 'SELECT * FROM shopsession WHERE cartid = ?'
    let newId = ''
    if (req.session.cartID === undefined) {
        do {
            newId = generateid()
        } while (checkIfIdExists(newId, table)) 
        req.session.cartID = newId  
    }
    let sql = 'SELECT * FROM product WHERE isactive = ?'
    connection.query(
        sql,['active'], (err, products) => {
            res.render('shop', {products: products, cartID: req.session.cartID})
        }
    )
})

app.post('/add-to-cart', (req, res) => {
    if (req.session.cartID === req.body.cartID) {
        let sql = 'SELECT * FROM shopsession WHERE productid = ? AND cartid = ?'
        connection.query(
            sql,
            [
                req.body.productid,
                req.body.cartID
            ],
            (error, results) => {
                if (results.length > 0) {
                    let sql = 'UPDATE shopsession SET quantity = ? WHERE productid = ? AND cartid = ?'
                    connection.query(
                        sql,
                        [
                            parseInt(results[0].quantity) + parseInt(req.body.quantity),
                            req.body.productid,
                            req.body.cartID
                        ],
                        (error, results) => {
                            res.redirect('/shop')
                        }
                    )
                } else {
                    let sql = 'INSERT INTO shopsession (productid, quantity, cartid) VALUES (?, ?, ?)'
                    connection.query(
                        sql,
                        [
                            req.body.productid,
                            parseInt(req.body.quantity),
                            req.body.cartID
                        ],
                        (error, results) => {
                            res.redirect('/shop')
                        }
                    )
                }
            }
        )
    }
})

app.get('/view-cart', (req, res) => {
    let sql = `
        SELECT ss.quantity, p.*
        FROM shopsession ss
        JOIN product p ON ss.productid = p.id
        WHERE ss.cartid = ? AND ss.isactive = 'active'
    `
    connection.query(
        sql,
        [req.session.cartID],
        (error, cartItems) => {
            if (error) throw error

            let total = 0

            if (cartItems && cartItems.length > 0) {
                cartItems.forEach(cartItem => {
                    total += (cartItem.quantity * parseFloat(cartItem.price))
                })
            }

            res.render('view-cart', { cartItems: cartItems, total: total, cartID: req.session.cartID})
        }
    )
})

app.post('/remove-from-cart', (req, res) => {
    let selectSql = 'SELECT quantity FROM shopsession WHERE productid = ? AND cartid = ?'
    connection.query(selectSql, [req.body.productid, req.body.cartID], (selectError, selectResults) => {
        let currentQuantity = selectResults[0].quantity
        if (currentQuantity > 1) {
            let updateSql = 'UPDATE shopsession SET quantity = ? WHERE productid = ? AND cartid = ?'
            connection.query(updateSql, [currentQuantity - 1, req.body.productid, req.body.cartID], (updateError, updateResults) => {
                res.redirect('/view-cart')
            })
        } else {
            let deleteSql = 'DELETE FROM shopsession WHERE productid = ? AND cartid = ?'
            connection.query(deleteSql, [req.body.productid, req.body.cartID], (deleteError, deleteResults) => {
                res.redirect('/view-cart')
            })
        }
    })
})

app.post('/clear-cart', (req, res) => {
    let sql = 'DELETE FROM shopsession WHERE cartid = ?'
    connection.query(
        sql,
        [req.session.cartID],
        (error, results) => {
            res.redirect('/shop')
        }
    )
})

app.post('/submit-order', (req, res) => {
    let sql = `
        SELECT ss.quantity, p.*
        FROM shopsession ss
        JOIN product p ON ss.productid = p.id
        WHERE ss.cartid = ? AND ss.isactive = 'active'
    `
    connection.query(
        sql,
        [req.session.cartID],
        (error, cartItems) => {
            if (error) throw error

            let total = 0

            if (cartItems && cartItems.length > 0) {
                cartItems.forEach(cartItem => {
                    total += (cartItem.quantity * parseFloat(cartItem.price))
                })
            }

            let order = {
                name: req.body.name,
                email: req.body.email,
                address: req.body.address,
                cartItems: cartItems,
                total: total
            }

            const orderEmailData = generateOrderConfirmationEmail(order)
            sendEmail(orderEmailData)

            const storeOwnerData = generateMessageNotificationEmail(order.name, order.email, 'New Order Received', orderEmailData.text)
            sendEmail(storeOwnerData)

            let updateSql = 'UPDATE shopsession SET isactive = ? WHERE cartid = ?'
            connection.query(
                updateSql,
                ['inactive', req.session.cartID],
                (error, results) => {
                    if (error) {
                        console.error('Error updating cart status:', error)
                        return res.status(500).send('An error occurred while processing your order.')
                    }
                    res.redirect('/shop')
                }
            )
        }
    )
})

app.get('/register', (req, res) => {
    const user = {
        fullname: '',
        email: '',
        password: '',
        confirmPassword: '',
        adminPIN: ''
    }
    res.render('register', { error: false, user: user })
})

app.post('/send-message', (req, res) => {
    let name = req.body.name
    let email = req.body.email
    let subject = req.body.subject
    let message = req.body.message
    
    let sql = 'INSERT INTO message (name, email, message, subject) VALUES (?, ?, ?, ?)'
    connection.query(
        sql,
        [name, email, message, subject],
        (error, results) => {
            if (error) {
                console.error('Error inserting message into database:', error)
                return res.status(500).send('An error occurred while processing your message.')
            }

            const messageData = generateMessageNotificationEmail(name, email, subject, message)
            sendEmail(messageData)

            res.redirect('/')
        }
    )
})

app.post('/suscribe-to-news-letter', (req, res) => {
    let email = req.body.email
    let sql = 'SELECT * FROM newsletter WHERE email = ?'
    connection.query(
        sql,
        [email],
        (error, results) => {
            if (error) {
                console.error('Error fetching newsletter subscription:', error)
                return res.status(500).send('An error occurred while processing your request.')
            }

            if (results.length > 0) {
                res.redirect('/shop')
            } else {
                let insertSql = 'INSERT INTO newsletter (email) VALUES (?)'
                connection.query(
                    insertSql,
                    [email],
                    (error, results) => {
                        if (error) {
                            console.error('Error inserting newsletter subscription:', error)
                            return res.status(500).send('An error occurred while processing your request.')
                        }

                        const confirmationData = {
                            from: 'softubhub@gmail.com',
                            to: email,
                            subject: 'Newsletter Subscription Confirmation',
                            text: 'Thank you for subscribing to our newsletter!'
                        }
                        sendEmail(confirmationData)

                        res.redirect('/')
                    }
                )
            }
        }
    )
})

app.post('/register', (req, res) => {
    const user = {
        name: req.body.fullname,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        admin: req.body.adminPIN
    }
    if (user.password === user.confirmPassword) {
        if (user.admin === ADMINPIN) {
            let sql = 'SELECT * FROM user WHERE email = ?'
            connection.query(sql, [user.email], (error, results) => {
                if (results.length > 0) {
                    let message = 'An account exists with that email number!'
                    user.email = ''
                    res.render('register', { error: true, message: message, user: user })
                } else {
                    let newId = ''
                    let sql = 'SELECT * FROM user WHERE id = ?'
                    do {
                        newId = generateid()
                    } while (checkIfIdExists(newId, sql))
                    bcrypt.hash(user.password, 10, (err, hash) => {
                        let sql = 'INSERT INTO user (name, email, password, id) VALUES (?, ?, ?, ?)'
                        connection.query(sql, [user.name, user.email, hash, newId], (error, results) => {
                            res.redirect('/login')
                        })
                    })
                }
            })
        } else {
            let message = 'Wrong Authorization PIN!'
            user.admin = ''
            res.render('register', { error: true, message: message, user: user })
        }
    } else {
        let message = 'Passwords don\'t match!'
        user.confirmPassword = ''
        res.render('register', { error: true, message: message, user: user })
    }
})

app.get('/login', (req, res) => {
    const user = {
        email: '',
        password: '',
        adminPIN: ''
    }
    res.render('login', { error: false, user: user })
})

app.post('/login-user', (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password,
        admin: req.body.adminPIN
    }
    if (user.admin === ADMINPIN) {
        let sql = 'SELECT * FROM user WHERE email = ?'
        connection.query(sql, [user.email], (error, results) => {
            if (results.length > 0) {
                bcrypt.compare(user.password, results[0].password, (error, passwordMatches) => {
                    if (passwordMatches) {
                        req.session.userID = results[0].id
                        res.redirect('/dashboard')
                    } else {
                        let message = 'Incorrect password!'
                        res.render('login', { error: true, message: message, user: user })
                    }
                })
            } else {
                let message = 'Account does not exist. Please create one'
                res.render('login', { error: true, message: message, user: user })
            }
        })
    } else {
        let message = 'Wrong Authorization PIN!'
        user.admin = ''
        res.render('login', { error: true, message: message, user: user })
    }
})

app.get('/dashboard', (req, res) => {
    loginRequired(req, res)
    let sql = 'SELECT * FROM product'
    connection.query(
        sql,[], (err, products) => {
            res.render('dashboard', {products: products})
        }
    )
})

app.get('/additem', (req, res) => {
    loginRequired(req, res)
    const item = {
        name: '',
        price: '',
        description: '',
        image: ''
    }
    res.render('additem', { error: false, item: item })
})

app.post('/additem', upload.single('image'), (req, res) => {
    loginRequired(req, res)
    const item = {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        image: req.file.filename
    }
    let newId = ''
    let psql = 'SELECT * FROM product WHERE id = ?'
    do {
        newId = generateid()
    } while (checkIfIdExists(newId, psql))
    let sql = 'INSERT INTO product (id, name, price, description, image) VALUES (?, ?, ?, ?, ?)'
    connection.query(
        sql,
        [
            newId,
            item.name,
            item.price,
            item.description,
            item.image
        ],
        (error, results) => {
            res.redirect('/dashboard')
        }
    )
})

app.post('/edit', (req, res) => {
    loginRequired(req, res)
    let id = req.body.productid
    let sql = 'SELECT * FROM product WHERE id = ?'
    connection.query(
        sql,[id], (err, product) => {
            res.render('edit', {error: false, item: product[0]})
        }
    )
})

app.post('/update-product', upload.single('image'), (req, res) => {
    loginRequired(req, res)
    const item = {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        image: req.file.filename,
        id: req.body.id
    }
    let sql = 'UPDATE product SET name = ?, price = ?, description = ?, image = ? WHERE id = ?'
    connection.query(
        sql,
        [
            item.name,
            item.price,
            item.description,
            item.image,
            item.id
        ],
        (error, results) => {
            res.redirect('/dashboard')
        }
    )
})

app.post('/activate/:id', (req, res) => {
    loginRequired(req, res)
    let id = req.params.id
    let sql = 'UPDATE product SET isactive = ? WHERE id = ?'
    connection.query(
        sql,
        [
            'active',
            id
        ],
        (err, results) => {
            res.redirect('/dashboard')
        }
    )
})

app.post('/deactivate/:id', (req, res) => {
    loginRequired(req, res)
    let id = req.params.id
    let sql = 'UPDATE product SET isactive = ? WHERE id = ?'
    connection.query(
        sql,
        [
            'inactive',
            id
        ],
        (err, results) => {
            res.redirect('/dashboard')
        }
    )
})

app.post('/activate-all', (req, res) => {
    loginRequired(req, res)
    let sql = 'UPDATE product SET isactive = ?'
    connection.query(
        sql,
        ['active'],
        (err, results) => {
            res.redirect('/dashboard')
        }
    )
})

app.post('/deactivate-all', (req, res) => {
    loginRequired(req, res)
    let id = req.params.id
    let sql = 'UPDATE product SET isactive = ?'
    connection.query(
        sql,
        ['inactive'],
        (err, results) => {
            res.redirect('/dashboard')
        }
    )
})

app.get('/privacy-policy', (req, res) => {
    res.render('privacy')
})

app.get('/terms-of-service', (req, res) => {
    res.render('terms')
})

app.get('/logout', (req, res) => {
    loginRequired(req, res)
    req.session.destroy((err) => {
        res.redirect('/')
    })
})

app.get('*', (req, res) => {
    res.render('404')
})

const PORT = process.env.PORT || 9000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
