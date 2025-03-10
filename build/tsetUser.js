// src/api/User.ts
class User {
  id;
  name;
  age;
  order;
  add() {
    console.log(111);
  }
}

// tsetUser.ts
var u = new User;
console.log(typeof u.order);
