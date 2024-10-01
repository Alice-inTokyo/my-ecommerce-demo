// Configuration for Cognito User Pool
var poolData = {
    UserPoolId: 'us-east-1_2lB5wPwww', // Replace with your User Pool ID
    ClientId: '5upsdrpj66rvtkr1p5uic8u3g0'   // Replace with your App Client ID
};
var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

// Function to display user info
function displayUserInfo() {
    var username = localStorage.getItem('username');
    var idToken = localStorage.getItem('idToken');
    var userInfoDiv = document.getElementById('user-info');

    if (username && idToken) {
        userInfoDiv.innerHTML = 'Welcome, ' + username + ' | <a href="#" onclick="logoutUser()">Logout</a>';
    } else {
        userInfoDiv.innerHTML = '<a href="login.html">Login</a> | <a href="register.html">Register</a>';
    }
}

// Function to fetch products from backend API
function fetchProducts() {
    fetch('http://your-load-balancer-dns-name/products')
        .then(response => response.json())
        .then(data => {
            const productList = document.getElementById('product-list');
            data.forEach(product => {
                const productItem = document.createElement('div');
                productItem.innerHTML = `
                    <h2>${product.Name}</h2>
                    <p>Price: $${product.Price}</p>
                    <p>${product.Description}</p>
                    ${localStorage.getItem('username') && localStorage.getItem('idToken') ? `<button onclick="orderProduct('${product.ProductID}')">Buy Now</button>` : '<p><a href="login.html">Login to purchase</a></p>'}
                `;
                productList.appendChild(productItem);
            });
        })
        .catch(error => console.error('Error:', error));
}

// Function to handle user registration
function registerUser(event) {
    event.preventDefault();
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    var email = document.getElementById('email').value;

    var attributeList = [];
    var dataEmail = {
        Name: 'email',
        Value: email
    };
    var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
    attributeList.push(attributeEmail);

    userPool.signUp(username, password, attributeList, null, function(err, result){
        if (err) {
            alert(err.message || JSON.stringify(err));
            return;
        }
        alert('Registration successful. Please check your email to verify your account.');
        window.location.href = 'login.html';
    });
}

// Function to handle user login
function loginUser(event) {
    event.preventDefault();
    var authenticationData = {
        Username: document.getElementById('username').value,
        Password: document.getElementById('password').value,
    };
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

    var userData = {
        Username: authenticationData.Username,
        Pool: userPool
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            console.log('Login successful');
            var accessToken = result.getAccessToken().getJwtToken();
            var idToken = result.getIdToken().getJwtToken();
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('idToken', idToken);
            localStorage.setItem('username', authenticationData.Username);
            window.location.href = 'index.html';
        },
        onFailure: function(err) {
            alert(err.message || JSON.stringify(err));
        }
    });
}

// Function to logout user
function logoutUser() {
    var cognitoUser = userPool.getCurrentUser();
    if (cognitoUser != null) {
        cognitoUser.signOut();
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

// Function to initiate order
function orderProduct(productID) {
    window.location.href = 'order.html?productID=' + encodeURIComponent(productID);
}

// Function to handle order submission
function submitOrder(event) {
    event.preventDefault();
    var quantity = document.getElementById('quantity').value;
    var productID = document.getElementById('productID').value;
    var idToken = localStorage.getItem('idToken');

    var orderData = {
        ProductID: productID,
        Quantity: parseInt(quantity),
        Username: localStorage.getItem('username')
    };

    fetch('http://your-load-balancer-dns-name/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': idToken
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        if (response.ok) {
            alert('Order has been placed successfully.');
            window.location.href = 'index.html';
        } else {
            return response.json().then(err => { throw new Error(err.message); });
        }
    })
    .catch(error => {
        alert('Error placing order: ' + error.message);
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('login-form')) {
        document.getElementById('login-form').addEventListener('submit', loginUser);
    }
    if (document.getElementById('register-form')) {
        document.getElementById('register-form').addEventListener('submit', registerUser);
    }
    if (document.getElementById('order-form')) {
        document.getElementById('order-form').addEventListener('submit', submitOrder);
    }
    if (document.getElementById('user-info')) {
        displayUserInfo();
    }
    if (document.getElementById('product-list')) {
        fetchProducts();
    }
    if (document.getElementById('order-form-container')) {
        // Get productID from URL parameters
        var urlParams = new URLSearchParams(window.location.search);
        var productID = urlParams.get('productID');
        if (!productID) {
            alert('No product selected.');
            window.location.href = 'index.html';
        } else {
            document.getElementById('order-form-container').innerHTML = `
                <form id="order-form">
                    <input type="hidden" id="productID" value="${productID}">
                    <label>Quantity:</label><input type="number" id="quantity" value="1" required><br>
                    <button type="submit">Submit Order</button>
                </form>
            `;
        }
    }
});