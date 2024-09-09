/********************************************************************************
* WEB322 – Assignment 06
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
*
* Name: William Cheuk Hei Wong Student ID: 135442226 Date: 7 Apr 2024
*
* Published URL:
*
********************************************************************************/


const legoData = require('./modules/legoSets');
const authData = require('./modules/auth-service');
const clientSessions = require('client-sessions');

const express = require('express');
const path = require('path');
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(
  clientSessions({
    cookieName: 'session', // this is the object name that will be added to 'req'
    secret: 'o6LjQ5EVNC28ZgK64hDELM18ScpFQr', // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
}

legoData.initialize()
.then(authData.initialize)
.then(() => {

  // home
  app.get('/', (req, res) => {
    res.render("home", { page: '/' });
  });

  // about
  app.get('/about', (req, res) => {
    res.render("about", { page: '/about' });
  });

  app.get('/login', (req, res) => {
    res.render('login', { errorMessage: "", userName: "" });
  });

  app.get('/register', (req, res) => {
    res.render('register', { errorMessage: "", successMessage: "", userName: "" });
  });

  app.post('/register', (req, res) => {
    authData.registerUser(req.body)
        .then(() => {
            res.render('register', { successMessage: "User created", errorMessage: "", userName: req.body.userName});
        })
        .catch((err) => {
            res.render('register', { errorMessage: err, successMessage: "", userName: ""});
        });
  });

  app.post('/login', (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    
    authData.checkUser(req.body)
        .then((user) => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            };
            res.redirect('/lego/sets');
        })
        .catch((err) => {
            res.render('login', { errorMessage: err, userName: req.body.userName });
        });
  });

  app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
  });

  app.get('/userHistory', ensureLogin, (req, res) => {
    res.render('userHistory');
  });

  app.get("/lego/addSet", ensureLogin, async (req, res) => {
    let themes = await legoData.getAllThemes()
    res.render("addSet", { themes: themes })
  });
  
  app.post("/lego/addSet", ensureLogin, async (req, res) => {
    try {
      await legoData.addSet(req.body);
      res.redirect("/lego/sets");
    } catch (err) {
      res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
    }
  
  });

  app.get('/lego/editSet/:id', ensureLogin, async (req, res) => {
    try {
      let themes = await legoData.getAllThemes();
      let set = await legoData.getSetByNum(req.params.id);
      res.render("editSet", { set, themes });
    } catch (err) {
      res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for"});
    }
  });
  
  app.post("/lego/editSet", ensureLogin, async (req, res) => {
    try {
      await legoData.editSet(req.body.set_num, req.body);
      res.redirect("/lego/sets");
    } catch (err) {
      res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
    }
  });
  
  app.post("/lego/deleteSet/:id", ensureLogin, async (req, res) => {
    try {
        await legoData.deleteSet(req.body.set_num);
        res.redirect("/lego/sets");
    } catch (err) {
        res.status(500).render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
    }
});

  // set
  app.get("/lego/sets", async (req, res) => {
    let sets = [];
    try {
      if (req.query.theme) {
        sets = await legoData.getSetsByTheme(req.query.theme);
      } else {
        sets = await legoData.getAllSets();
      }
      res.render("sets", { sets })
    } catch (err) {
      res.status(404).render("404", { message: err });
    }
  });

  // id
  app.get('/lego/sets/:id', (req, res) => {
    const setNum = req.params.id;
    legoData.getSetByNum(setNum).then((data) => {
      res.render("set", {set: data});
    }).catch((err) => {
      res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for"});
    });
  });


  app.use((req, res) => {
    res.status(404).render("404", { message: "Page not found", page: req.path })
  });
    
    
  app.listen(HTTP_PORT, () => {
      console.log(`Server is listening at http://localhost:${HTTP_PORT}`);
    });

  
})
.catch(error => {
  console.error('Error initializing Lego data:', error);
});