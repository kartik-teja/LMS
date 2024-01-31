/* eslint-disable linebreak-style */
const express = require('express');
const session = require('express-session');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const {Users, Courses, Chapters} = require('./models/');
const {Console} = require('console');


app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'looks')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', (request, response) => {
  response.render('index');
});
app.use(
    session({
      secret: 'this_is_a_super_secret_key',
      resave: false,
      saveUninitialized: true,
    }),
);
app.post('/login', async (req, res) => {
  try {
    const user = await Users.findOne({
      where: {
        email: req.body.email,
        password: req.body.password,
        role: req.body.role,
      },
    });

    if (user) {
      req.session.email = req.body.email;
      if (user.role === 'tutor') {
        res.redirect('/tutor');
      } else {
        if (user.role === 'user') {
          res.redirect('/user');
        } else {
          res.status(404).send('Invalid role');
        }
      }
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(401).send('Invalid credentials');
  }
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', async (req, res) => {
  console.log(req.body);
  try {
    const newUser = await Users.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
    });

    console.log('New user created:', newUser.toJSON());

    res.redirect('/');
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/tutor', async (req, res) => {
  console.log(req.session);
  const tutoremail = req.session.email;
  try {
    const courses = await Courses.findAll();
    res.render('tutor', {courses, tutoremail});
  } catch (error) {
    res.render('tutor', {courses: null, tutoremail});
  }
});

app.get('/user', async (req, res) => {
  console.log(req.session);
  const courses = await Courses.findAll();
  console.log(courses);
  res.render('user', {courses});
});

app.get('/course', (req, res) => {
  console.log(req.session);
  const tutoremail = req.session.email;
  res.render('course', {tutoremail: tutoremail});
});

app.post('/course', async (req, res) => {
  console.log(req.body);
  try {
    const {courseName} = req.body;
    const email = req.session.email;

    const newCourse = await Courses.create({
      name: courseName,
      description: '',
      email: email,
      chapters: [],
      registeredUsersCount: 0,
    });

    console.log('New course created:', newCourse.toJSON());

    res.redirect(`/viewcourse?courseName=${courseName}`);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/viewChapter', async (req, res)=>{
  try {
    console.log(req.query);
    const userEmail = req.session.email;
    const chapterName = req.query.chapterName;
    const courseId = req.query.courseId;

    console.log(userEmail, chapterName, courseId);

    const chapter = await Chapters.findOne({
      where: {
        title: chapterName,
        courseId: courseId,
      },
    });

    if (!chapter) {
      return res.status(404).send('Chapter not found');
    }
    const pages = chapter.pages.map((pageString) => JSON.parse(pageString));

    console.log(pages);

    res.render('viewChapter', {
      name: chapter.title,
      page: pages,
      courseId: courseId,
    });
  } catch (error) {
    console.error('Error fetching course and chapters:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});


app.get('/viewCourse', async (req, res) => {
  try {
    const userEmail = req.session.email;
    const courseName = req.query.courseName;

    const course = await Courses.findOne({
      where: {
        email: userEmail,
        name: courseName,
      },
    });
    console.log(course.chapters);

    if (!course) {
      return res.status(404).send('Course not found');
    }

    res.render('viewcourse', {
      course: course,
      chapters: course.chapters,
      courseId: course.id,
    });
  } catch (error) {
    console.error('Error fetching course and chapters:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/designChapter', (req, res) => {
  console.log(req.session);
  const courseName = req.query.name||req.body.name;
  console.log(courseName);
  res.render('designChapter', {title: courseName});
});

app.post('/designChapter', async (req, res) => {
  try {
    const tutoremail = req.session.email;
    const courseName = req.body.coursename||req.query.name;

    console.log('Request Body:', req.body);

    const course = await Courses.findOne({
      where: {
        name: courseName,
        email: tutoremail,
      },
    });

    console.log('Found Course:', course);

    if (course) {
      const updatedCourse = await course.update({
        chapters: [...course.chapters, req.body.chapterName],
      });
      console.log('Course description updated:', course.toJSON());

      const tutor = await Users.findOne({
        where: {
          email: tutoremail,
        },
      });


      const newChapter = await Chapters.create({
        title: req.body.chapterName,
        description: req.body.description,
        pages: [],
        name: tutor ? tutor.name : 'Unknown',
        email: tutoremail,
        courseId: course.id,
      });
      console.log('New chapter created:', newChapter.toJSON());

      req.session.courseId = newChapter.courseId;
      req.session.title = newChapter.title;
      res.redirect(`/designPage/?chapterName=${newChapter.title}`);
    } else {
      res.status(404).send('Course not found');
    }
  } catch (error) {
    console.error('Error updating course description:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/mycourses', async (req, res) => {
  try {
    const tutoremail = req.session.email;

    const courses = await Courses.findAll({
      where: {
        email: tutoremail,
      },
    });

    res.render('mycourses', {courses});
  } catch (error) {
    console.error('Error fetching tutor\'s courses:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/report', async (req, res) => {
  try {
    const tutoremail = req.session.email;

    const courses = await Courses.findAll({
      where: {
        email: tutoremail,
      },
    });

    const courseNames = courses.map((course) => course.dataValues.name);
    const registeredUsersCounts = courses.map(
        (course) => course.dataValues.registeredUsersCount,
    );
    res.render('report', {
      courseNames: courseNames,
      registeredUsersCounts: registeredUsersCounts,
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/signout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error signing out:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.redirect('/login');
    }
  });
});

app.get('/designPage', async (req, res) =>{
  console.log(req.session);
  try {
    console.log(req.query);
    const courseId = req.session.courseId||req.body.courseId||
    req.query.courseId;
    const title = req.query.title||req.body.title;

    res.render('designPage', {courseId: courseId, title: title});
  } catch (error) {
    console.error('Error rendering designPage:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/designPage', async (req, res) => {
  console.log(req.body);
  const chapterName = req.body.Chapter;
  const courseId = req.session.courseId||req.body.courseId;
  const page = req.body.Page;
  const editorContent = req.body.editorContent;

  const chapter = await Chapters.findOne({
    where: {
      title: chapterName,
      courseId: courseId,
    },
  });
  if (!chapter) {
    return res.status(404).send('Chapter not found');
  }
  const updatedChapter = await chapter.update({
    pages: [...chapter.pages, {head: page, body: editorContent}],
  });

  console.log('Chapter updated:', updatedChapter.toJSON());

  console.log('Chapter:', chapter);
  console.log('Editor Content:', editorContent);

  res.redirect(`/viewChapter/?chapterName=${chapterName}&courseId=${courseId}`);
});

module.exports = app;
