import express from 'express'
import mysql from 'mysql'
import session from 'express-session'
import bcrypt from 'bcrypt'


const app = express()

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'agrihub',
})


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

app.get('/', (req, res) => {
    res.render('index.ejs')
})


app.get('/shop', (req, res) => {
    res.render('shop.ejs')
})

app.get('/privacy-policy', (req, res) => {
    res.render('privacy.ejs')
})

app.get('/terms-of-service', (req, res) => {
    res.render('terms.ejs')
})

app.get('/register', (req, res) => {
    const user = {
        name: '',
        phone: '',
        password: '',
        confirmPassword: ''
    }
    res.render('register', { error: false, user: user })
})

app.post('/register-user', (req, res) => {
    const user = {
        name: req.body.name,
        phone: req.body.phone,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword
    }
    // check if the passwords match
    if (user.password === user.confirmPassword) {
        let sql = 'SELECT * FROM user WHERE phone_number = ?'

        connection.query(sql, [user.phone], (error, results) => {
            if (results.length > 0) {
                let message = 'An account exists with that phone number!'
                user.phone = ''
                res.render('register', { error: true, message: message, user: user })
            } else {
                // hash the password
                bcrypt.hash(user.password, 10, (err, hash) => {
                    let sql = 'INSERT INTO user (name, phone_number, password) VALUES (?, ?, ?)'
                    connection.query(sql, [user.name, user.phone, hash], (error, results) => {
                        res.redirect('/login')
                    })
                })
            }
        })
    } else {
        let message = 'Passwords don\'t match!'
        user.confirmPassword = ''
        res.render('register', { error: true, message: message, user: user })
    }
})

app.get('/login', (req, res) => {
    const user = {
        phone: '',
        password: ''
    }
    res.render('login.ejs', { error: false, user: user })
})

// Process login page
app.post('/login-user', (req, res) => {
    const user = {
        phone: req.body.phone,
        password: req.body.password
    }

    // check if the user exists
    let sql = 'SELECT * FROM user WHERE phone_number = ?'
    connection.query(sql, [user.phone], (error, results) => {
        if (results.length > 0) {
            bcrypt.compare(user.password, results[0].password, (error, passwordMatches) => {
                if (passwordMatches) {
                    req.session.userID = results[0].id
                    req.session.name = results[0].name.split(' ')[0]
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
})

app.get('/dashboard', (req, res) => {
    loginRequired(req, res)
    res.render('dashboard', { name: req.session.name })
})

app.get('/logout', (req, res) => {
    loginRequired(req, res)
    // Destroy the session and redirect to the home page
    req.session.destroy((err) => {
        res.redirect('/')
    })
})


const PORT = process.env.PORT || 9000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})