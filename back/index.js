const PORT = 8000
const jwt = require('jsonwebtoken')
const express = require('express')
const mysql = require('mysql')
const cors = require('cors')
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
/*const bodyParser = require('body-parser');*/

var bodyParser = require('body-parser');
const e = require('express');
const { response } = require('express');

const app = express()
app.use(express.json())

app.use(cors(
  {
    origin: ["http://localhost:3000"],
    methods: ["POST", "GET", "PUT", "DELETE"],
    credentials: true
  }));
app.use('/uploads', express.static("./uploads"));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



const db = mysql.createConnection({

  host: "localhost",
  user: "wvxiotea_infisea",
  password: "infisea@123",
  database: "wvxiotea_infisea"
})






app.use(session({
  secret: 'infisea',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 // 1 day
  }
}));


app.post('/register', (req, res) => {
  const sql = "INSERT INTO admin (`aid`,`name`,`email`,`mobno`,`pass`) VALUES (?)";
  const values = [
    req.body.id,
    req.body.name,
    req.body.email,
    req.body.mobno,
    req.body.pass
  ];
  console.log(values);

  db.query(sql, [values], (err, data) => {
    if (err) return res.json('error');
    else {
      return res.json(data);
      return console.log(data);
      return console.log(res);
    }
    // return res.json(data); 

  })
})




app.post('/login', (req, res) => {


  const sql = 'SELECT * FROM admin WHERE `email` = ?';
  const values = [req.body.lc];

  db.query(sql, [values], async (err, data) => {
    if (err) return res.json('error');
    else {


      if (data.length > 0) {
        if (data[0].pass === req.body.pass) {


          // req.session.username = data[0].aid
          // console.log(req.session.username); 


          const token = jwt.sign({ id: data[0].aid }, "infisea", { expiresIn: "1h" });
          // 1 hour in milliseconds

          // Set the token as a cookie with maxAge and expires options
          const expiresIn = 3600000;
          res.cookie('atoken', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: expiresIn, // Sets the cookie's expiration time in milliseconds from now
            expires: new Date(Date.now() + expiresIn), // Sets the absolute expiration time for the cookie
          });




          return res.json({ data, token });
        } else {
          return res.json('error');

        }
      } else {
        return res.json('error');

      }
    }
  });
});


const verifytoken = (req, res, next) => {
  const token = req.cookies.atoken;

  if (!token) {
    return res.status(403).send({ message: 'No token Provided!' })
  }

  jwt.verify(token, "infisea", (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized!' });

    }

    console.log(decoded, "middleware");
    console.log(decoded.id, "middle id")
    req.admin = decoded.id;
    next();
  })

}



app.get('/verifytoken', verifytoken, (req, res) => {
  res.json({ isAuthenticated:"the token is verified"});
});



const verifydmin = (req, res, next) => {
  const id = req.admin;
  console.log(id);

  const sql = "SELECT aid FROM admin WHERE aid = ?"; // Query to check if the admin exists
  db.query(sql, [id], (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (data.length > 0) {
      next(); // Admin exists, proceed to the next middleware or route handler
    } else {
      return res.status(401).json({ error: 'Unauthorized' }); // Admin not found
    }
  });
}



/*
app.get('/session', (req, res) => {
  const isAuthenticated = req.session.username ? true : false;
  res.json({ isAuthenticated });
});*/


app.get('/admindashboard', verifytoken, verifydmin, (req, res) => {

  //console.log(req.session.username)
  //console.log(req.cookies.userPrimaryKey)
  const sql = 'SELECT * FROM admin WHERE `aid` = ?';
  db.query(sql, [req.admin], (err, result) => {
    if (err) {
      console.error(err);
      res.json(err);
    } else {
      if (result.length > 0) {
        const userProfile = {
          id: result[0].id,
          name: result[0].name,
          mobno: result[0].mobno,
          email: result[0].email,
          pass: result[0].pass,
          aid: result[0].aid
        };
        console.log(userProfile);
        res.json(userProfile);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    }
  });

});



app.get('/updateproduct/:CategoryID', verifytoken, verifydmin, (req, res) => {
  console.log(req.params.CategoryID)

  const sql = 'SELECT * FROM product WHERE `CategoryID` = ?';
  db.query(sql, [req.params.CategoryID], (err, result) => {
    if (err) {
      console.error(err);
      res.json(err);
    } else {
      if (result.length > 0) {
        const userProfile = {
          id: result[0].Id,
          name: result[0].ProductName,
          productid: result[0].ProductID,
          price: result[0].Price,
          deliverycharges: result[0].DeliveryCharge,
          tax: result[0].Tax,
          finalPrice: result[0].FinalPrice,
          quantity: result[0].StockQuantity,
          weight: result[0].Weight,
          rating: result[0].Rating,
          desc: result[0].Description,
          isAvailable: result[0].IsAvailable,
          images: result[0].Images
        };

        console.log(userProfile);
        res.json(userProfile);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    }
  });

});




app.put('/updateadminprofile', verifytoken, verifydmin, (req, res) => {
  const { name, email, mobno, pass } = req.body;
  // const aid = req.session.username;
  //const aid = req.cookies.userPrimaryKey;
  const aid = req.admin;
  const sql = "UPDATE admin SET `name`=?, `email`=?, `mobno`=?, `pass`=? WHERE `aid`=?";
  const values = [name, email, mobno, pass, aid];

  db.query(sql, values, (err, data) => {
    if (err) {
      console.error(err);
      res.json('error');
    } else {
      res.json(data);
    }
  });
});



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + '.' + file.originalname.split('.').pop());
  },
});

const upload = multer({ storage: storage });

app.post('/addproduct', upload.array('images', 15), (req, res) => {
  const fileNames = req.files.map((file) => file.filename);
  const concatenatedFilenames = fileNames.join(',');

  const sql = "INSERT INTO product (`CategoryID`,`ProductName`,`ProductID`,`Price`,`Tax`,`DeliveryCharge`,`FinalPrice`,`StockQuantity`,`Weight`,`Rating`,`Description`,`Images`,`isAvailable`) VALUES (?)";
  const values = [
    req.body.id,
    req.body.name,
    req.body.productid,
    req.body.price,
    req.body.tax,
    req.body.deliverycharges,
    req.body.finalPrice,
    req.body.quantity,
    req.body.weight,
    req.body.ratings,
    req.body.desc,
    concatenatedFilenames,
    req.body.isAvailable
  ];

  console.log(values);

  db.query(sql, [values], (err, data) => {
    if (err) {
      console.error('Error inserting product into database: ', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(data);
      console.log(data);
    }
  });
});



app.get('/getproducts', (req, res) => {
  const sql = "SELECT CategoryID,ProductName,ProductID,Price,Tax,DeliveryCharge,FinalPrice,StockQuantity,Weight,Rating,Description,Images,IsAvailable FROM product";

  db.query(sql, (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error });
    } else {
      console.log(data);
      res.json(data);
    }
  });
});


app.get('/getproductsinfo/:CategoryID', (req, res) => {
  console.log(req.params.CategoryID)

  const sql = 'SELECT * FROM product WHERE `CategoryID` = ?';
  db.query(sql, [req.params.CategoryID], (err, result) => {
    if (err) {
      console.error(err);
      res.json(err);
    } else {
      if (result.length > 0) {
        const userProfile = {
          id: result[0].Id,
          name: result[0].ProductName,
          productid: result[0].ProductID,
          price: result[0].Price,
          deliverycharges: result[0].DeliveryCharge,
          tax: result[0].Tax,
          finalPrice: result[0].FinalPrice,
          quantity: result[0].StockQuantity,
          weight: result[0].Weight,
          rating: result[0].Rating,
          desc: result[0].Description,
          isAvailable: result[0].IsAvailable,
          images: result[0].Images
        };

        console.log(userProfile);
        res.json(userProfile);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    }
  });

});




app.put('/updateProduct/:CategoryID', upload.none(), verifytoken, verifydmin, (req, res) => {
  const productId = req.params.CategoryID;
  const { name, productid, price, deliverycharges, tax, finalPrice, quantity, weight, rating, desc, isAvailable } = req.body;

  const sql = "UPDATE product SET `ProductName`=?, `ProductID`=?, `Price`=?, `DeliveryCharge`=?, `Tax`=?, `FinalPrice`=?, `StockQuantity`=?, `Weight`=?, `Rating`=?, `Description`=?, `isAvailable`=? WHERE `CategoryID`=?";

  const values = [name, productid, price, deliverycharges, tax, finalPrice, quantity, weight, rating, desc, isAvailable, productId];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error updating product:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      console.log('Product updated successfully');
      res.json(result);
    }
  });
});

app.delete('/removeproduct/:CategoryID', verifytoken, verifydmin, (req, res) => {
  const { CategoryID } = req.params;
  console.log(CategoryID);

  const sql = "DELETE FROM `product` WHERE CategoryID = ?";

  db.query(sql, [CategoryID], (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    else {

      const productSql = "DELETE FROM `cart` WHERE CategoryID = ?";
      db.query(productSql, [CategoryID], (productErr, productData) => {
        if (productErr) {
          console.error(productErr);
          return res.status(500).json({ error: "Error removing from product table" });
        }


        return res.json(data);

      });

    }

  });
});









app.post('/logout', (req, res) => {



  //res.clearCookie('userPrimaryKey', { path: '/' })
  res.clearCookie('atoken', { path: '/' })
  return res.json('success')


});





app.get('/allorders', verifytoken, verifydmin, (req, res) => {
  const sql = "SELECT o.OrderID, o.Total, o.status,o.orderdate,c.name  AS cname,c.mobno,c.amno,c.adl1,c.adl2,c.vtc,c.state,c.country,c.pin, (SELECT GROUP_CONCAT(DISTINCT CategoryID) FROM orders WHERE OrderID = o.OrderID) AS CategoryIDs, (SELECT GROUP_CONCAT(DISTINCT ProductName) FROM orders WHERE OrderID = o.OrderID) AS ProductNames, (SELECT GROUP_CONCAT(Quantity) FROM orders WHERE OrderID = o.OrderID) AS Quantities, (SELECT GROUP_CONCAT(DISTINCT FinalPrice) FROM orders WHERE OrderID = o.OrderID) AS Fps, (SELECT GROUP_CONCAT(DISTINCT expprice) FROM orders WHERE OrderID = o.OrderID) AS Exp FROM orders o JOIN customer c ON o.cid = c.cid GROUP BY o.OrderID ORDER BY o.orderdate DESC";
  db.query(sql, (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching all orders' });
    } else {
      console.log(data);
      res.json(data);
    }
  });
});


app.get('/neworders', verifytoken, verifydmin, (req, res) => {
  const sql = "SELECT o.OrderID, o.Total, o.status,o.orderdate, c.name As cname,c.mobno,c.amno,c.adl1,c.adl2,c.vtc,c.state,c.country,c.pin, (SELECT GROUP_CONCAT(DISTINCT CategoryID) FROM orders WHERE OrderID = o.OrderID) AS CategoryIDs, (SELECT GROUP_CONCAT(DISTINCT ProductName) FROM orders WHERE OrderID = o.OrderID) AS ProductNames, (SELECT GROUP_CONCAT(Quantity) FROM orders WHERE OrderID = o.OrderID) AS Quantities, (SELECT GROUP_CONCAT(DISTINCT FinalPrice) FROM orders WHERE OrderID = o.OrderID) AS Fps, (SELECT GROUP_CONCAT(DISTINCT expprice) FROM orders WHERE OrderID = o.OrderID) AS Exp FROM orders o JOIN customer c ON o.cid = c.cid WHERE o.status='placed' GROUP BY o.OrderID  ORDER BY o.orderdate DESC";
  db.query(sql, (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching orders which are placed' });
    } else {
      console.log(data);
      res.json(data);
    }
  });
});


app.get('/ofdorders', verifytoken, verifydmin, (req, res) => {
  const sql = "SELECT o.OrderID, o.Total, o.status,o.orderdate, c.name As cname,c.mobno,c.amno,c.adl1,c.adl2,c.vtc,c.state,c.country,c.pin, (SELECT GROUP_CONCAT(DISTINCT CategoryID) FROM orders WHERE OrderID = o.OrderID) AS CategoryIDs, (SELECT GROUP_CONCAT(DISTINCT ProductName) FROM orders WHERE OrderID = o.OrderID) AS ProductNames, (SELECT GROUP_CONCAT(Quantity) FROM orders WHERE OrderID = o.OrderID) AS Quantities, (SELECT GROUP_CONCAT(DISTINCT FinalPrice) FROM orders WHERE OrderID = o.OrderID) AS Fps, (SELECT GROUP_CONCAT(DISTINCT expprice) FROM orders WHERE OrderID = o.OrderID) AS Exp FROM orders o JOIN customer c ON o.cid = c.cid WHERE o.status='ofd' GROUP BY o.OrderID  ORDER BY o.orderdate DESC";
  db.query(sql, (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching orders which are placed' });
    } else {
      console.log(data);
      res.json(data);
    }
  });
});


app.get('/deliveredorders', verifytoken, verifydmin, (req, res) => {
  const sql = "SELECT o.OrderID, o.Total, o.status,o.orderdate, c.name As cname,c.mobno,c.amno,c.adl1,c.adl2,c.vtc,c.state,c.country,c.pin, (SELECT GROUP_CONCAT(DISTINCT CategoryID) FROM orders WHERE OrderID = o.OrderID) AS CategoryIDs, (SELECT GROUP_CONCAT(DISTINCT ProductName) FROM orders WHERE OrderID = o.OrderID) AS ProductNames, (SELECT GROUP_CONCAT(Quantity) FROM orders WHERE OrderID = o.OrderID) AS Quantities, (SELECT GROUP_CONCAT(DISTINCT FinalPrice) FROM orders WHERE OrderID = o.OrderID) AS Fps, (SELECT GROUP_CONCAT(DISTINCT expprice) FROM orders WHERE OrderID = o.OrderID) AS Exp FROM orders o JOIN customer c ON o.cid = c.cid WHERE o.status='delivered' GROUP BY o.OrderID  ORDER BY o.orderdate DESC";
  db.query(sql, (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching orders which are placed' });
    } else {
      console.log(data);
      res.json(data);
    }
  });
});


app.get('/canceledorders', verifytoken, verifydmin, (req, res) => {
  const sql = "SELECT o.OrderID, o.Total, o.status,o.orderdate, c.name As cname,c.mobno,c.amno,c.adl1,c.adl2,c.vtc,c.state,c.country,c.pin, (SELECT GROUP_CONCAT(DISTINCT CategoryID) FROM orders WHERE OrderID = o.OrderID) AS CategoryIDs, (SELECT GROUP_CONCAT(DISTINCT ProductName) FROM orders WHERE OrderID = o.OrderID) AS ProductNames, (SELECT GROUP_CONCAT(Quantity) FROM orders WHERE OrderID = o.OrderID) AS Quantities, (SELECT GROUP_CONCAT(DISTINCT FinalPrice) FROM orders WHERE OrderID = o.OrderID) AS Fps, (SELECT GROUP_CONCAT(DISTINCT expprice) FROM orders WHERE OrderID = o.OrderID) AS Exp FROM orders o JOIN customer c ON o.cid = c.cid WHERE o.status='canceled' GROUP BY o.OrderID  ORDER BY o.orderdate DESC";
  db.query(sql, (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching orders which are placed' });
    } else {
      console.log(data);
      res.json(data);
    }
  });
});




app.put('/updateOrderStatus', verifytoken, verifydmin, (req, res) => {
  const { OrderID, newStatus } = req.body;
  const sql = "UPDATE orders SET status = ? WHERE OrderID = ?";
  db.query(sql, [newStatus, OrderID], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error updating order status' });
    } else {
      res.json({ message: 'Order status updated successfully' });
    }
  });
});


app.put('/updateOrderStatus2', verifytoken, verifydmin, (req, res) => {
  const { OrderID, newStatus } = req.body;
  const sql = "UPDATE orders SET status = 'canceled' WHERE OrderID = ?";
  db.query(sql, [OrderID], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error updating order status' });
    } else {
      res.json({ message: 'Order status updated successfully' });
    }
  });
});












/*----------------------------------------------------------------------------------------------------*/









/* FOR CUSTOMER, REST API */








app.post('/registercust', (req, res) => {
  const sql = "INSERT INTO customer (`cid`,`name`,`email`,`mobno`,`pass`,`adl1`,`adl2`,`vtc`,`state`,`country`,`pin`,`amno`) VALUES (?)";
  const values = [
    req.body.id,
    req.body.name,
    req.body.email,
    req.body.mobno,
    req.body.pass,
    req.body.al1,
    req.body.al2,
    req.body.vt,
    req.body.state,
    req.body.country,
    req.body.pincode,
    req.body.amno
  ];
  console.log(values);
  db.query(sql, [values], (err, data) => {
    if (err) {
      console.log(err)
      return res.json("error");
    }


    else {
      return res.json(data);
      return console.log(data);
      return console.log(res);
    }
    // return res.json(data); 

  })
})







app.post('/custlogin', (req, res) => {


  const sql = 'SELECT * FROM customer WHERE `email` = ?';
  const values = [req.body.lc];

  db.query(sql, [values], async (err, data) => {
    if (err) return res.json('error');
    else {


      if (data.length > 0) {
        if (data[0].pass === req.body.pass) {


          //  req.session.custname = data[0].cid
          // console.log(req.session.custname); 

        const token2 = jwt.sign({id: data[0].cid})

          return res.json(data);
        } else {
          return res.json('error');

        }
      } else {
        return res.json('error');

      }
    }
  });
});


/*

app.get('/session2', (req, res) => {
  const isAuthenticated = req.session.custname ? true : false;
  res.json({ isAuthenticated });
});
*/

app.get('/custdashboard', (req, res) => {

  console.log(req.cookies.custPrimaryKey)
  const sql = 'SELECT * FROM customer WHERE `cid` = ?';
  db.query(sql, [req.cookies.custPrimaryKey], (err, result) => {
    if (err) {
      console.error(err);
      res.json(err);
    } else {
      if (result.length > 0) {
        const userProfile = {
          id: result[0].id,
          name: result[0].name,
          mobno: result[0].mobno,
          email: result[0].email,
          pass: result[0].pass,
          cid: result[0].cid,
          al1: result[0].adl1,
          al2: result[0].adl2,
          vt: result[0].vtc,
          state: result[0].state,
          country: result[0].country,
          pin: result[0].pin,
          amno: result[0].amno
        };
        console.log(userProfile);
        res.json(userProfile);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    }
  });

});



app.get('/getproductscs', (req, res) => {
  const sql = "SELECT CategoryID,ProductName,ProductID,Price,Tax,DeliveryCharge,FinalPrice,StockQuantity,Weight,Rating,Description,Images,IsAvailable FROM product WHERE IsAvailable = 1";
  db.query(sql, (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error });
    } else {
      console.log(data);
      res.json(data);
    }
  });
});



app.get('/gcaddr', (req, res) => {
  console.log(req.cookies.custPrimaryKey)
  const sql = 'SELECT * FROM customer WHERE `cid` = ?';
  db.query(sql, [req.cookies.custPrimaryKey], (err, result) => {
    if (err) {
      console.error(err);
      res.json(err);
    } else {
      if (result.length > 0) {
        const userProfile = {
          id: result[0].id,
          name: result[0].name,
          mobno: result[0].mobno,
          email: result[0].email,
          pass: result[0].pass,
          cid: result[0].cid,
          al1: result[0].adl1,
          al2: result[0].adl2,
          vt: result[0].vtc,
          state: result[0].state,
          country: result[0].country,
          pin: result[0].pin,
          amno: result[0].amno

        };
        console.log(userProfile);
        res.json(userProfile);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    }
  });

})



app.post('/logoutcust', (req, res) => {
  /* req.session.destroy(err => {
       if (err) {
           console.error(err);
           return res.json({ error: 'An error occurred during logout.' });
       }
*/
  console.log(req.cookies.custPrimaryKey);
  console.log("DhiruBaccha");
  res.clearCookie('custPrimaryKey', { path: '/' });
  return res.json({ success: true });
});




app.put('/updatecustprofile', (req, res) => {
  const { name, email, mobno, pass, al1, al2, vt, state, country, pin, amno } = req.body;
  const cid = req.cookies.custPrimaryKey;
  const sql = "UPDATE customer SET `name`=?, `email`=?, `mobno`=?, `pass`=?, `adl1`=?, `adl2`=?, `vtc`=?, `state`=?, `country`=?, `pin`=?, `amno`=? WHERE `cid`=?";
  const values = [name, email, mobno, pass, al1, al2, vt, state, country, pin, amno, cid];
  db.query(sql, values, (err, data) => {
    if (err) {
      console.error(err);
      res.json('error');
    } else {
      res.json(data);
    }
  });
});






app.put('/updatecustadd', (req, res) => {
  const { name, email, mobno, pass, al1, al2, vt, state, country, pin, amno } = req.body;
  const cid = req.cookies.custPrimaryKey;
  const sql = "UPDATE customer SET `name`=?, `email`=?, `mobno`=?, `pass`=?, `adl1`=?, `adl2`=?, `vtc`=?, `state`=?, `country`=?, `pin`=?, `amno`=? WHERE `cid`=?";
  const values = [name, email, mobno, pass, al1, al2, vt, state, country, pin, amno, cid];
  db.query(sql, values, (err, data) => {
    if (err) {
      console.error(err);
      res.json('error');
    } else {
      res.json(data);
    }
  });
});








app.post('/addToCart', (req, res) => {
  const { cid, productId, productName, categoryId, desc, price, tax, deliverycharges, finalPrice, stock, Weight, images, available, quantity, expprice } = req.body;
  console.log(cid, productId, productName, categoryId, desc, price, tax, deliverycharges, finalPrice, stock, Weight, images, available, quantity, expprice);
  const ifexist = "SELECT * FROM cart WHERE cid = ? AND CategoryID = ?";
  db.query(ifexist, [cid, categoryId], (err, data) => {
    if (err) {
      console.log(err);
      res.json('THERE IS AN ERROR', err);
    } else {
      if (data.length > 0) {
        console.log("Exist")
        return res.json('recordexists');
      }

      else {

        const sql = "INSERT INTO cart (cid, ProductId, ProductName, CategoryID, Description, Quantity, Price, DeliveryCharge, Tax, FinalPrice, expprice, StockQuantity, Weight, Images, IsAvailable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        db.query(sql, [cid, productId, productName, categoryId, desc, quantity, price, deliverycharges, tax, finalPrice, expprice, stock, Weight, images, available], (err, data) => {
          if (err) {
            console.error('Error inserting product into database: ', err);
            res.status(500).json({ error: 'Internal server error' });
          } else {
            res.json('Productinserted');
            // console.log(data);
          }
        });
      }
    }
  });
});


app.get('/getCartData', (req, res) => {
  console.log(req.query.custPrimaryKey);
  const sql = "SELECT * FROM cart WHERE `cid`=?"
  db.query(sql, [req.query.custPrimaryKey], (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error });
    } else {
      console.log(data);
      res.json(data);
    }
  });
});// Import necessary modules and setup express app




app.delete('/removefromcart/:CategoryID', (req, res) => {
  const { CategoryID } = req.params;
  const { custPrimaryKey } = req.query;
  console.log(CategoryID, custPrimaryKey);
  const sql = "DELETE FROM `cart` WHERE CategoryID = ? AND cid = ?";
  db.query(sql, [CategoryID, custPrimaryKey], (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    return res.json(data);
  });
});




app.post('/addTowishlist', (req, res) => {
  const { cid, productId, productName, categoryId, desc, price, tax, deliverycharges, finalPrice, stock, Weight, images, available } = req.body;
  console.log(cid, productId, productName, categoryId, desc, price, tax, deliverycharges, finalPrice, stock, Weight, images, available);
  const ifexist = "SELECT * FROM wishlist WHERE cid = ? AND CategoryID = ?";
  db.query(ifexist, [cid, categoryId], (err, data) => {
    if (err) {
      console.log(err);
      res.json('THERE IS AN ERROR', err);
    } else {
      if (data.length > 0) {
        console.log("Exist")
        return res.json('recordexists');
      }
      else {
        const sql = "INSERT INTO wishlist (cid, ProductId, ProductName, CategoryID, Description, Price, DeliveryCharge, Tax, FinalPrice, StockQuantity, Weight, Images, IsAvailable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        db.query(sql, [cid, productId, productName, categoryId, desc, price, deliverycharges, tax, finalPrice, stock, Weight, images, available], (err, data) => {
          if (err) {
            console.error('Error inserting product into database: ', err);
            res.status(500).json({ error: 'Internal server error' });
          } else {
            res.json('Productinserted');
            // console.log(data);
          }
        });
      }
    }
  });
});




app.get('/getWishlistData', (req, res) => {
  console.log(req.query.custPrimaryKey);
  const sql = "SELECT id,cid,CategoryID,ProductName,ProductID,Price,Tax,DeliveryCharge,FinalPrice,StockQuantity,Weight,Description,Images,IsAvailable FROM wishlist WHERE `cid`= ?";
  db.query(sql, [req.query.custPrimaryKey], (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error });
    } else {
      console.log(data);
      res.json(data);
    }
  });
});



app.delete('/removefromWishlist/:CategoryID', (req, res) => {
  const { CategoryID } = req.params;
  const { custPrimaryKey } = req.query;

  console.log(CategoryID, custPrimaryKey);

  const sql = "DELETE FROM `wishlist` WHERE CategoryID = ? AND cid = ?";

  db.query(sql, [CategoryID, custPrimaryKey], (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    return res.json(data);
  });
});





app.post('/fpidcc', (req, res) => {
  const { custprimary, orderid, productsDetails, fixedTotalExpprice } = req.body;

  try {
    // Iterate through each product
    for (const product of productsDetails) {
      const productQuery = 'SELECT StockQuantity FROM product WHERE CategoryID = ?';

      // Execute the product query
      db.query(productQuery, [product.CategoryID], (err, results) => {
        if (err) {
          console.error('Error fetching product quantity:', err);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }

        // Check if the fetched result is available
        if (results.length === 0 || results[0].StockQuantity < product.Quantity) {
          // If condition not satisfied, send response indicating insufficient data
          res.json("InsufficientData");
          return;
        } else {
          // Condition satisfied, calculate new StockQuantity
          const newStockQuantity = results[0].StockQuantity - product.Quantity;

          // Update the StockQuantity in the product table
          db.query(
            'UPDATE product SET StockQuantity = ? WHERE ProductID = ?',
            [newStockQuantity, product.ProductID],
            (err, updateResult) => {
              if (err) {
                console.error('Error updating StockQuantity:', err);
                return res.status(500).json({ error: 'Internal server error' });

              }

              // Insert the order details
              db.query(
                'INSERT INTO orders (OrderID, cid, CategoryID, ProductID, ProductName, Description, Quantity, Price, Tax, DeliveryCharge, FinalPrice, expprice, Weight,Total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [orderid, custprimary, product.CategoryID, product.ProductID, product.ProductName, product.Description, product.Quantity, product.Price, product.Tax, product.Delivery, product.Total, product.Expprice, product.Weight, fixedTotalExpprice],
                (err, insertResult) => {
                  if (err) {
                    console.error('Error inserting order details:', err);
                    return res.status(500).json({ error: 'Internal server error' });

                  }

                  // Delete the item from cart after successful insertion into order
                  db.query(
                    'DELETE FROM cart WHERE CategoryID = ? AND cid = ?',
                    [product.CategoryID, custprimary],
                    (err, deleteResult) => {
                      if (err) {
                        console.error('Error deleting item from cart:', err);
                        return res.status(500).json({ error: 'Internal server error' });

                      }
                    }
                  );
                }
              );
            }
          );
        }
      });
    }

    // After processing all products, send success response
    res.json("ProductInserted");

  } catch (error) {
    console.error('Error inserting product details:', error);
    res.status(500).json("error");
  }
});


app.get('/fetchOrder', (req, res) => {
  console.log(req.cookies.custPrimaryKey);
  const sql = "SELECT o.OrderID, o.Total, o.status, (SELECT GROUP_CONCAT(DISTINCT CategoryID) FROM orders WHERE OrderID = o.OrderID) AS CategoryIDs, (SELECT GROUP_CONCAT(DISTINCT ProductName) FROM orders WHERE OrderID = o.OrderID) AS ProductNames, (SELECT GROUP_CONCAT(Quantity) FROM orders WHERE OrderID = o.OrderID) AS Quantities, (SELECT GROUP_CONCAT(DISTINCT FinalPrice) FROM orders WHERE OrderID = o.OrderID) AS Fps,(SELECT GROUP_CONCAT(DISTINCT expprice) FROM orders WHERE OrderID = o.OrderID) AS Exp FROM orders o WHERE cid = ? GROUP BY o.OrderID";
  db.query(sql, req.cookies.custPrimaryKey, (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching orders' });
    } else {
      console.log(data);
      res.json(data);
    }
  });
});




app.get('/printorder/:OrderID', (req, res) => {

  const sql = "SELECT p.*, o.*, c.*, o.CategoryID, o.cid FROM orders o JOIN product p ON o.CategoryID = p.CategoryID JOIN customer c ON o.cid = c.cid WHERE o.OrderID = ?;";
  db.query(sql, req.params.OrderID, (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching orders' });
    } else {
      console.log(data);
      res.json(data);
    }
  });
});




app.post('/')

app.get('/my', (req, res) => {
  res.json('myapi')
})

app.listen(PORT, () => {
  console.log("run ho raha hai ruk jarssa");
})









/*
app.post('/fpidcc', async (req, res) => {
  const { custprimary, orderid, productsDetails } = req.body;

  try {
    const results = [];

    for (const product of productsDetails) {
      // Query to fetch StockQuantity for the product
      const productQuery = 'SELECT StockQuantity FROM product WHERE CategoryID = ?';
      
      // Execute the product query using async/await
      const productResult = await new Promise((resolve, reject) => {
        db.query(productQuery, [product.CategoryID], (err, results) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(results);
        });
      });

      // Check if the fetched result is available
      if (productResult.length === 0 || productResult[0].StockQuantity < product.Quantity) {
        // If condition not satisfied, send response indicating insufficient data
        res.status(400).json({ error: 'Insufficient data for product' });
        return;
      }

      // Calculate new StockQuantity
      const newStockQuantity = productResult[0].StockQuantity - product.Quantity;

      // Update the StockQuantity in the product table
      await new Promise((resolve, reject) => {
        db.query(
          'UPDATE product SET StockQuantity = ? WHERE CategoryID = ?',
          [newStockQuantity, product.CategoryID],
          (err, updateResult) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(updateResult);
          }
        );
      });

      // Insert the order details
      await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO orders (OrderID, cid, CategoryID, ProductID, ProductName, Description, Quantity, Price, Tax, DeliveryCharge, FinalPrice, expprice, Weight) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [orderid, custprimary, product.CategoryID, product.ProductID, product.ProductName, product.Description, product.Quantity, product.Price, product.Tax, product.Delivery, product.Total, product.Expprice, product.Weight],
          (err, insertResult) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(insertResult);
          }
        );
      });

      // Delete the item from cart after successful insertion into order
      await new Promise((resolve, reject) => {
        db.query(
          'DELETE FROM cart WHERE CategoryID = ? AND cid = ?',
          [product.CategoryID, custprimary],
          (err, deleteResult) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(deleteResult);
          }
        );
      });

      // Push product details to results array
      results.push(productResult);
    }

    // Send success response after processing all products
    res.json({ success: true, message: 'Products inserted successfully' });

  } catch (error) {
    console.error('Error inserting product details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

*/
