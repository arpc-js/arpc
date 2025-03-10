// src/api/User.ts
class User {
  static meta = { id: "number", name: "string", age: "number", order: "Order" };
  id;
  name;
  age;
  order;
  add() {
    console.log(111);
  }
}

// testreg.ts
var user = new User;
console.log(user);
