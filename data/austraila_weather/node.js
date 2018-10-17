const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user : 'root',
  password: 'Hamidhamid#2580',
  database : 'books'
}  
);

connection.connect();

const book = {
  author : 'amir',
  title : 'laptop',
  pages : 200
};

const query = connection.query('insert into books set ?', book.author, function (err, req) {
    console.log(query.sql)
})