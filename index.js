//FinalProjectPart2
//server.js

const express = require("express");
const app = express();

let morgan = require("morgan");
app.use(morgan("combined"));

let bodyParser = require("body-parser");
app.use(bodyParser.raw({ type: "*/*" }));

const cors = require("cors");
app.use(cors());
+//test
app.get("/", (request, response) => {
  return response.send("Ping!");
});

//Copy paste the following endpoint into your project so that your sourcecode will be in the submission certificate
app.get("/sourcecode", (req, res) => {
  res.send(
    require("fs")
      .readFileSync(__filename)
      .toString()
  );
});

//generate a new token on each new login or user connection or session
let genUniqueToken = () => {
  return "" + Math.floor(Math.random() * 1000000000000);
};

// Structure of data
let accounts = [];
let account = {};

let listings = new Map();

let cart = [];
let caart = {};

//1
app.post("/signup", (req, res) => {
   let usr = JSON.parse(req.body).username;
  let passWord = JSON.parse(req.body).password;
  let Account = accounts.some(e => e.username === usr);
  let usrPass = accounts.find(e => e.password === passWord);

  if (!usr) {
    return res.send(
      JSON.stringify({ success: false, reason: "username field missing" })
    );
  } else if (!passWord) {
    return res.send(
      JSON.stringify({ success: false, reason: "password field missing" })
    );
  } else if (Account) {
    return res.send(
      JSON.stringify({ success: false, reason: "Username exists" })
    );
  }
  let account = {
    username: usr,
    password: passWord,
    token: null
  };
  accounts.push(account);
  return res.send(JSON.stringify({ success: true }));
});

//2-
app.post("/login", (req, res) => {
  let usr = JSON.parse(req.body).username;
  let actualUserPass = JSON.parse(req.body).password;
  let Account = accounts.find(e => e.username === usr);
  let expectedPass = accounts.find(e => e.password === actualUserPass);

  if (!usr) {
    return res.send(
      JSON.stringify({ success: false, reason: "username field missing" })
    );
  } else if (!actualUserPass) {
    res.send(
      JSON.stringify({ success: false, reason: "password field missing" })
    );
  } else if (!Account) {
    return res.send(
      JSON.stringify({ success: false, reason: "User does not exist" })
    );
  } else if (!expectedPass) {
    return res.send(
      JSON.stringify({ success: false, reason: "Invalid password" })
    );
  }

  let token;
  for (let x in Account) {
    if (Account[x] === null) {
      Account[x] = genUniqueToken();
    }
    token = Account[x];
  }
  Object.assign(account, Account);
  //accounts.push(account)

  res.send(JSON.stringify({ success: true, token: token }));
  return;
});

//3
app.post("/change-password", (req, res) => {

  let parsedBody = JSON.parse(req.body);
  let oldPassword = JSON.parse(req.body).oldPassword;
  let newPassword = JSON.parse(req.body).newPassword;

  let usrOldPass = accounts.find(
    e => e.password === JSON.parse(req.body).oldPassword
  );

  let Account = accounts.find(e => e.password === oldPassword);
  let head = accounts.find(e => e.token === req.headers.token);

  if (!req.headers.token) {
    return res.send(
      JSON.stringify({ success: false, reason: "token field missing" })
    );
  } else if (!head) {
    return res.send(
      JSON.stringify({ success: false, reason: "Invalid token" }) //ok
    );
  } else if (!usrOldPass) {
    //3-If the value of the oldPassword is invalid
    return res.send(
      JSON.stringify({ success: false, reason: "Unable to authenticate" })
    );
  }
  for (let x in Account) {
    if (Account[x] === oldPassword) {
      Account[x] = newPassword;
    }
  }
  // UPDATE
  Object.assign(account, Account);
  return res.send(JSON.stringify({ success: true }));
});

//4from front end itemid, we sens back itemID. to check
app.post("/create-listing", (req, res) => {
  console.log("---------begin POST /create-listing-----------------------");

  let parsedBody = JSON.parse(req.body);
  let Account = accounts.find(e => e.token === req.headers.token);

  if (!req.headers.token) {
    return res.send(
      JSON.stringify({ success: false, reason: "token field missing" })
    );
  } else if (!Account) {
    return res.send(
      JSON.stringify({ success: false, reason: "Invalid token" })
    );
  } else if (!parsedBody.price) {
    return res.send(
      JSON.stringify({ success: false, reason: "price field missing" })
    );
  } else if (!parsedBody.description) {
    return res.send(
      JSON.stringify({ success: false, reason: "description field missing" })
    );
  }
  let sellerUsername;
  let z = accounts.find(e => {
    if (e !== undefined && e.username !== undefined) {
      sellerUsername = e.username;
    }
  });

  let listingId = genUniqueToken();
  listings.set(listingId, {
    price: parsedBody.price,
    description: parsedBody.description,
    itemId: listingId,
    sellerUsername: sellerUsername,
    isPurchased: false
  });
  //console.log("listings::", listings);
  return res.send(JSON.stringify({ success: true, listingId: listingId }));
});

//5
app.get("/listing", (req, res) => {
  console.log("---------begin GET /listing-----------------------");
  let listing = listings.get(req.query.listingId);

  if (!listing) {
    return res.send(
      JSON.stringify({ success: false, reason: "Invalid listing id" })
    );
  }

  return res.send(
    JSON.stringify({
      success: true,
      listing: {
        price: listing.price,
        description: listing.description,
        itemId: req.query.listingId,
        sellerUsername: listing.sellerUsername
      }
    })
  );
});



//6 
app.post("/modify-listing", (req, res) => {
  console.log("---------begin POST /modify-listing-----------------------");
  let parsedBody = JSON.parse(req.body);
  let Account = accounts.find(e => e.token === req.headers.token);
  let listing = listings.get(parsedBody.itemid);

 
  if (!req.headers.token) {
    return res.send(
      JSON.stringify({ success: false, reason: "token field missing" })
    );
  } else if (!Account) {
    return res.send(
      JSON.stringify({ success: false, reason: "Invalid token" })
    );
  } else if (!parsedBody.itemid) {
    return res.send(
      JSON.stringify({ success: false, reason: "itemid field missing" })
    );
  }
  if (parsedBody.price) {
    listings.set(parsedBody.itemid, {
      price: parsedBody.price,
      description: listing.description,
      itemId: parsedBody.itemid,
      sellerUsername: listing.sellerUsername,
      isPurchased: false
    });
  }
  if (parsedBody.description) {
    listings.set(parsedBody.itemid, {
      price: listing.price,
      description: parsedBody.description,
      itemId: parsedBody.itemid,
      sellerUsername: listing.sellerUsername,
      isPurchased: false
    });
  }

  return res.send(JSON.stringify({ success: true }));
});


// 7 
app.post("/add-to-cart", (req, res) => {
  console.log("---------begin POST /add-to-cart-----------------------");
  let parsedBody = JSON.parse(req.body);
  let Account = accounts.find(e => e.token === req.headers.token);
  let itemToAddToCart = listings.get(parsedBody.itemid); //***changed at 2pm

  //console.log("Account::", Account); //Account:: { username: 'e5VDXYtYaPeWPJS', password: 'VLsMOvWdtN6ro7O', token: '987688184030'}
  //console.log("parsedBody::", parsedBody); // { itemid: '653929461780' }
  // console.log("itemToAddToCart::", itemToAddToCart); // {  price: 943, description: 'new boat679', itemid: '423078149218', sellerUsername: 'dRFJujrDdOj7BmV'}

  if (!Account) {
    return res.send(
      JSON.stringify({ success: false, reason: "Invalid token" })
    );
  } else if (!parsedBody.itemid) {
       return res.send(
      JSON.stringify({ success: false, reason: "itemid field missing" })
    );
  } else if (!listings.has(parsedBody.itemid)) {
    return res.send(
      JSON.stringify({ success: false, reason: "Item not found" })
    );
  }
  cart.push({ token: req.headers.token, item: itemToAddToCart });

  //console.log("caart::", caart);
  //console.log("cart::", cart);

  return res.send(JSON.stringify({ success: true }));
});



//8
app.get("/cart", (req, res) => {
  console.log("---------begin GET /cart-----------------------");
  let Account = accounts.find(e => e.token === req.headers.token);
  //let usrCart = cart.find(e => e.token === req.headers.token);
  let userCart = [];

  if (!Account) {
    return res.send(
      JSON.stringify({ success: false, reason: "Invalid token" })
    );
  }

  //I need to get user cart //cart before removing the rest
  Object.entries(cart).forEach(([k, v]) => {
    if (v.token === req.headers.token) {
      let item = v.item;
      userCart.push({
        price: item.price,
        description: item.description,
        itemId: item.itemId,
        sellerUsername: item.sellerUsername
      });
    }
  });

  // console.log("usrCartt::", usrCartt)
  return res.send(JSON.stringify({ success: true, cart: userCart }));
});

//ok up to here 48%

let purchasedItems = [];
let purchasedItemsE = {};
//9 purchase items in cart
app.post("/checkout", (req, res) => {
  console.log("---------begin POST /checkout-----------------------");

  let isPurchasedBefore = false;
  let Account = accounts.find(e => e.token === req.headers.token);
  let userCart = [];
  Object.entries(cart).forEach(([k, v]) => {
    if (v.token === req.headers.token) {
      let item = v.item;
      userCart.push({
        price: item.price,
        description: item.description,
        itemId: item.itemId,
        sellerUsername: item.sellerUsername
      });
      if (item.isPurchased) {
        isPurchasedBefore = true;
      }
    }
  });

  if (!Account) {
    return res.send(
      JSON.stringify({ success: false, reason: "Invalid token" })
    );
  } else if (isPurchasedBefore) {
    return res.send(
      JSON.stringify({
        success: false,
        reason: "Item in cart no longer available"
      })
    );
  } else if (userCart.length === 0) {
    return res.send(JSON.stringify({ success: false, reason: "Empty cart" }));
  }

  console.log("cart???: ", cart);
  console.log("userCart???: ", userCart);
  
  for (let j = 0; j < userCart.length; j++) {
    for (let i = 0; i < cart.length; i++) {
      if (
        cart[i].token === req.headers.token &&
        cart[i].item.itemId === userCart[j].itemId
      ) {
        cart[i].item.isPurchased = true;
      }
    }
  }

  return res.send(JSON.stringify({ success: true }));
});


app.get("/purchase-history", (req, res) => {
  let Account = accounts.find(e => e.token === req.headers.token);
  
  if (!Account) {
    return res.send(
      JSON.stringify({ success: false, reason: "Invalid token" })
    );
  } 
  
  let purchasedArray = [];
  for (let i = 0; i < cart.length; i++) {
    if (
      cart[i].token === req.headers.token &&
      cart[i].item.isPurchased
    ) {
      purchasedArray.push({
        price: cart[i].item.price,
        description: cart[i].item.description,
        itemId: cart[i].item.itemId,
        sellerUsername: cart[i].item.sellerUsername
      })
    }
  }
  
  return res.send(JSON.stringify({ success: true, purchased: purchasedArray }));
});



        
        
 //app.listen process.env.PORT || 3000       

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});



