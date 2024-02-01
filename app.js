/* eslint-disable linebreak-style */
const express = require('express');
const session = require('express-session');
const app = express();
const path = require('path');
const Sequelize = require('sequelize');
const bodyParser = require('body-parser');
const {Users, Courses, Chapters} = require('./models/');
const users = require('./models/users');


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

app.get('/login', (req, res)=>{
  res.render('login');
});

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

app.get('/search', async (req, res) => {
  try {
    console.log(req.body);
    const mail = req.session.email;
    const user = await Users.findOne({where: {email: mail}});
    console.log(mail);
    const searchQuery = req.query.search.trim();
    const courses = await Courses.findAll({
      where: {
        name: {[Sequelize.Op.like]: '%' + searchQuery + '%'},
      },
    });
    console.log(user);
    if (user) {
      if (user.role === 'tutor') {
        res.render('tutor', {courses, tutoremail: mail});
      } else if (user.role === 'user') {
        res.render('user', {courses, mail});
      } else {
        res.status(404).send('Invalid role');
      }
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
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
      console.log('Course description updated:', updatedCourse.toJSON());

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

app.get('/enrolled', async (req, res)=>{
  const email = req.session.email;
  const user = await Users.findOne({where: {email: email}});

  if (user) {
    const enrolledCourses = [];
    for (const courseId of user.enrolled) {
      const course = await Courses.findOne({where: {id: courseId}});
      enrolledCourses.push(course);
    }
    console.log(enrolledCourses);

    res.render('enrolled', {courses: enrolledCourses});
  } else {
    console.error('Error fetching tutor\'s courses:', error);
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
    console.log(courses);

    const courseNames = courses.map((course) => course.dataValues.name);
    const chapterCount = courses.map(
        (course) => course.dataValues.chapters.length);
    const registeredUsersCounts = courses.map(
        (course) => course.dataValues.registeredUsersCount,
    );
    res.render('report', {
      courseNames: courseNames,
      registeredUsersCounts: registeredUsersCounts,
      chapters: chapterCount,
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
    const title = req.query.chapterName;

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
    pages: [...chapter.pages,
      {head: page, body: editorContent, completed: false}],
  });

  console.log('Chapter updated:', updatedChapter.toJSON());

  console.log('Chapter:', chapter);
  console.log('Editor Content:', editorContent);

  res.redirect(`/viewChapter/?chapterName=${chapterName}&courseId=${courseId}`);
});

app.get('/viewPage', (req, res)=>{
  console.log(req.query);
  const pageHead = req.query.head;
  const pageBody = req.query.body;
  const pageCompleted = req.query.completed;
  const chapter = req.query.chapter;
  const courseId = req.query.courseId;

  res.render('viewPage',
      {head: pageHead, body: pageBody,
        completed: pageCompleted, chapter, courseId});
});

app.get('/viewCourseU', async (req, res)=>{
  console.log(req.body);
  console.log(req.session);
  console.log(req.query);
  const useremail = req.session.email;
  const {courseName, courseId} = req.query;
  const course = await Courses.findOne({where: {id: courseId}});
  const firstName = await Users.findOne({where: {email: course.email}});
  const user = await Users.findOne({where: {email: useremail}});
  console.log(user.enrolled, courseId);
  const enrolled = user.enrolled.map((item) => item.toString()); ;
  const userIsEnrolled = enrolled.includes(courseId.toString());
  console.log(userIsEnrolled);

  res.render('viewCourseU',
      {courseName, courseId, course, chapters: course.chapters,
        firstName: firstName.firstName, userIsEnrolled});
});


app.get('/changepassword', (req, res)=>{
  res.render('changepassword');
});


app.post('/changepassword', async (req, res)=>{
  const email = req.session.email;
  const user = await Users.findOne({where: {email: email}});
  console.log(req.body);
  if (user.password === req.body.Password) {
    const updatedUser = user.update({password: req.body.newpassword});
    console.log(updatedUser);
  } else {
    res.redirect('/changepassword');
  }
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
});

app.get('/viewChapterU', async (req, res)=>{
  try {
    const chapterName = req.query.chapterName;
    const courseId = req.query.courseId;

    console.log(chapterName, courseId);

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

    res.render('viewChapterU', {
      name: chapter.title,
      page: pages,
      courseId: courseId,
    });
  } catch (error) {
    console.error('Error fetching course and chapters:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});

app.post('/updatePage', async (req, res)=>{
  console.log(req.body);
  const chapterName = req.body.chapter;
  const courseId = req.body.courseId.trim();
  const chapter = await Chapters.findOne(
      {where: {title: chapterName, courseId: courseId}});
  console.log(chapter);
  const indexToRemove = chapter.pages.findIndex((page) =>
    page.head === req.body.pageHead.trim() &&
    page.body === req.body.pageBody &&
    page.completed === false,
  );

  if (indexToRemove !== -1) {
    chapter.pages.splice(indexToRemove, 1);
  }


  chapter.pages.push({
    head: req.body.pageHead.trim(),
    body: req.body.pageBody,
    completed: req.body.complete,
  });

  await chapter.save();

  res.redirect(`/viewPage/?courseId=${courseId}
      &chapter=${chapterName}&head=${req.body.pageHead}
            &body=${req.body.pageBody}&completed=${req.body.complete}`);
});

app.post('/enrollCourse', async (req, res) => {
  try {
    const courseId = req.body.courseId;
    const course = await Courses.findOne({where: {id: courseId}});
    const email = req.session.email;
    const user = await Users.findOne({where: {email: email}});
    console.log(user);
    const updatecourse = await course.update(
        {registeredUsersCount: course.registeredUsersCount+1});
    const updateduser = await user.update({
      enrolled: [...user.enrolled, courseId],
    });
    console.log(updateduser, updatecourse);
    res.redirect(
        `/viewCourseU?courseName=${course.name}&courseId=${course.id}`);
  } catch (error) {
    console.error('Error enrolling in the course:', error);
    res.status(500).send('Internal Server Error');
  }
});
module.exports = app;
