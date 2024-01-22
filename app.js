import express from 'express'
import mysql from 'mysql'
import session from 'express-session'
import bcrypt from 'bcrypt'
import multer from 'multer'
import dotenv from 'dotenv'


const app = express()

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'softhub'
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


// Prepare to use session
app.use(session({
    secret: 'agrhub',
    saveUninitialized: false,
    resave: true
}))

// Continue to check if the user is logged in
app.use((req, res, next) => {
    res.locals.isLogedIn = (req.session.userID !== undefined)
    next()
})

function loginRequired(req, res) {
    res.locals.isLogedIn || res.redirect('/login')
}

function generateid() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const randomCharacters = Array.from({ length: 10 }, () => characters.charAt(Math.floor(Math.random() * characters.length)))
    const genID = randomCharacters.join('')
    return genID
}
function checkIfIdExists(id, table) {
    let sql = `SELECT * FROM ${table} WHERE id = ?`
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
            res.render('index.ejs', {products: products})
        }
    )
})

app.get('/shop', (req, res) => {
    let sql = 'SELECT * FROM product WHERE isactive = ?'
    connection.query(
        sql,['active'], (err, products) => {
            res.render('shop.ejs', {products: products})
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

app.post('/register', (req, res) => {
    const user = {
        name: req.body.fullname,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        admin: req.body.adminPIN
    }
    // check if the passwords match
    if (user.password === user.confirmPassword) {
        // Check if admin pin is correct
        if (user.admin === ADMINPIN) {
            let sql = 'SELECT * FROM user WHERE email = ?'
            connection.query(sql, [user.email], (error, results) => {
                if (results.length > 0) {
                    let message = 'An account exists with that email number!'
                    user.email = ''
                    res.render('register', { error: true, message: message, user: user })
                } else {
                    let table = 'user'
                    let newId = ''
                    do {
                        newId = generateid()
                    } while (checkIfIdExists(newId, table))
                    newId
                    // hash the password
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
        email: 'lu@wi',
        password: 'lu@wi',
        adminPIN: '1'
    }
    res.render('login.ejs', { error: false, user: user })
})

// Process login page
app.post('/login-user', (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password,
        admin: req.body.adminPIN
    }
    if (user.admin === ADMINPIN) {
        console.log(user)
        // check if the user exists
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
    let sql = 'SELECT * FROM product'
    connection.query(
        sql,[], (err, products) => {
            res.render('dashboard.ejs', {products: products})
        }
    )
})

// add item
app.get('/additem', (req, res) => {
    const item = {
        name: '',
        price: '',
        description: '',
        image: ''
    }
    res.render('additem.ejs', { error: false, item: item })
})

// Process add item form
app.post('/additem', upload.single('image'), (req, res) => {
    const item = {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        image: req.file.filename
    }
    let table = 'product'
    let newId = ''
    do {
        newId = generateid()
    } while (checkIfIdExists(newId, table))
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
    let id = req.body.productid
    let sql = 'SELECT * FROM product WHERE id = ?'
    connection.query(
        sql,[id], (err, product) => {
            res.render('edit', {error: false, item: product[0]})
        }
    )
})

app.post('/update-product', upload.single('image'), (req, res) => {
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
    res.render('privacy.ejs')
})

app.get('/terms-of-service', (req, res) => {
    res.render('terms.ejs')
})

app.get('/logout', (req, res) => {
    loginRequired(req, res)
    req.session.destroy((err) => {
        res.redirect('/')
    })
})

const PORT = process.env.PORT || 9000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})