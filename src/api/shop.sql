CREATE TABLE users (
                       id INT PRIMARY KEY AUTO_INCREMENT,
                       name VARCHAR(50) NOT NULL UNIQUE,
                       pwd VARCHAR(100) NOT NULL,
                       email VARCHAR(100),
                       phone VARCHAR(20),
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE roles (
                       id INT PRIMARY KEY AUTO_INCREMENT,
                       name VARCHAR(50) NOT NULL UNIQUE,
                       description VARCHAR(255),
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE permissions (
                             id INT PRIMARY KEY AUTO_INCREMENT,
                             name VARCHAR(100) NOT NULL,
                             code VARCHAR(100) NOT NULL UNIQUE, -- 如：user:add, user:delete
                             path VARCHAR(100) NOT NULL UNIQUE, -- 如：/user/add
                             type ENUM('menu', 'button', 'api') DEFAULT 'api',
                             parent_id INT DEFAULT NULL, -- 父权限ID，用于构建树状菜单
                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE user_roles (
                            user_id INT,
                            role_id INT,
                            PRIMARY KEY (user_id, role_id),
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
CREATE TABLE role_permissions (
                                  role_id INT,
                                  permission_id INT,
                                  PRIMARY KEY (role_id, permission_id),
                                  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                                  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);
CREATE TABLE spu (
                     id INT PRIMARY KEY AUTO_INCREMENT,
                     name VARCHAR(500) NOT NULL,
                     price DOUBLE PRECISION NOT NULL,
                     url VARCHAR(500) NULL,
                     brand VARCHAR(255) NULL,
                     status int default 0,
                     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE task (
                     id INT PRIMARY KEY AUTO_INCREMENT,
                     keyword VARCHAR(50) NOT NULL,
                     count int NOT NULL,
                     finish_count int default 0,
                     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE developer (
                      id INT PRIMARY KEY AUTO_INCREMENT,
                      name VARCHAR(50) NOT NULL,
                      appid VARCHAR(250) NOT NULL,
                      secret VARCHAR(250) NOT NULL,
                      access_token VARCHAR(250),
                      access_token_expire_in int,
                      refresh_token VARCHAR(250),
                      refresh_token_expire_in int,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE shop (
                           id INT PRIMARY KEY AUTO_INCREMENT,
                           name VARCHAR(50) NOT NULL,
                           cipher VARCHAR(50) NOT NULL,
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)

