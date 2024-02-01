const request = require('supertest');
const app = require('../app');

describe('POST /login', () => {
  it('should log in a user with valid credentials', async () => {
    const res = await request(app)
        .post('/login')
        .send({email: 'test@example.com', password: 'password', role: 'user'});
    expect(res.statusCode).toEqual(302);
  });

  it('should return 401 for invalid credentials', async () => {
    const res = await request(app)
        .post('/login')
        .send({email: 'invalid@example.com',
          password: 'wrongpassword', role: 'user'});
    expect(res.statusCode).toEqual(401);
  });
});

describe('POST /signup', () => {
  it('should create a new user', async () => {
    const res = await request(app)
        .post('/signup')
        .send({firstName: 'John', lastName: 'Doe',
          email: 'john@example.com', password: 'password', role: 'user'});
    expect(res.statusCode).toEqual(302);
  });
});

describe('GET /viewChapter', () => {
  it('should render the viewChapter page with valid chapter name and course ID', async () => {
    const res = await request(app)
        .get('/viewChapter')
        .query({chapterName: 'Chapter 1', courseId: '123'});
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Chapter 1');
  });

  it('should return 404 for non-existing chapter', async () => {
    const res = await request(app)
        .get('/viewChapter')
        .query({chapterName: 'Nonexistent Chapter', courseId: '123'});
    expect(res.statusCode).toEqual(404);
  });
});

describe('GET /viewCourse', () => {
  it('should render the viewCourse page with valid course name', async () => {
    const res = await request(app)
        .get('/viewCourse')
        .query({courseName: 'Course 1'});
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Course 1');
  });

  it('should return 404 for non-existing course', async () => {
    const res = await request(app)
        .get('/viewCourse')
        .query({courseName: 'Nonexistent Course'});
    expect(res.statusCode).toEqual(404);
  });
});
