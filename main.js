let mealsState = [];
let user = {}
let ruta = "login"; // login, registro, orders

const stringToHtml = (s) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(s, "text/html");

  return doc.body.firstChild;
};

const renderItem = (item) => {
  const element = stringToHtml(`<li data-id="${item._id}">${item.name}</li>`);

  element.addEventListener("click", () => {
    const mealsList = document.getElementById("meals-list");
    Array.from(mealsList.children).forEach((x) =>
      x.classList.remove("selected")
    );
    element.classList.add("selected");
    const mealsIdInput = document.getElementById("meals-id");
    mealsIdInput.value = item._id;
  });

  return element;
};

const renderOrder = (order, meals) => {
  const meal = meals.find((meal) => meal._id == order.meal_id);
  const element = stringToHtml(
    `<li data-id="${order._id}">${meal.name}: ${order.user_id}</li>`
  );

  return element;
};

const inicializaFormulario = () => {
  const orderForm = document.getElementById("order");
  // click en el boton
  orderForm.onsubmit = (e) => {
    // evitamos que al hacer click en el boton se actualice el browcer
    e.preventDefault();
    const submit = document.getElementById("submit");
    // desavilita el boton
    submit.setAttribute("disabled", true);
    // capturamos el id de la meal que a sido seleccionada
    const mealId = document.getElementById("meals-id");
    const mealIdValue = mealId.value;
    // si no es seleccionada ninguna, manda un mensaje
    if (!mealIdValue) {
      alert("Debe Seleccionar un plato");
      submit.removeAttribute("disabled");
      return;
    }
    // creamos una orden - esto se va a eliminar
    const order = {
      meal_id: mealIdValue,
      user_id: user._id,
    };
    // Guardamos la order en la DB
    fetch("https://almuerzi-backend-cml096.vercel.app/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    })
      .then((x) => x.json())
      .then((res) => {
        // actualizamos la ul de orders
        const renderedOrder = renderOrder(res, mealsState);
        const ordersList = document.getElementById("orders-list");
        ordersList.appendChild(renderedOrder);
        // activamos el boton
        submit.removeAttribute("disabled");
      });
  }; // Fin evento click
};

const inicializaDatos = () => {
  // Pedimos las meals a la DB
  fetch("https://almuerzi-backend-cml096.vercel.app/api/meals")
    .then((res) => res.json())
    .then((data) => {
      mealsState = data;
      // obtenmos el ul de meals
      const mealsList = document.getElementById("meals-list");
      // obtenemos el boton
      const submit = document.getElementById("submit");
      // obtenemos un listado de li de todos los meal obtenidos en la BD
      const listItems = data.map(renderItem);
      // elminamos el parrafo cargando del ul
      mealsList.removeChild(mealsList.firstElementChild);
      //actualizamos los datos del ul de meals con los detos que obtubimos en el fetch
      listItems.forEach((element) => mealsList.appendChild(element));
      //  habilitamos el boton
      submit.removeAttribute("disabled");
      // obtenemos las ordenes de la BD
      fetch("https://almuerzi-backend-cml096.vercel.app/api/orders")
        .then((res) => res.json())
        .then((ordersData) => {
          // lo mismo obtenemos un listado de estructura html li con las orders obtenidas en el fetch
          const listOrders = ordersData.map((orderData) =>
            renderOrder(orderData, data)
          );
          // obtenemos el ul de las orders
          const ordersList = document.getElementById("orders-list");
          // eliminamos el parrafo cargando
          ordersList.removeChild(ordersList.firstElementChild);
          // agregamos los elementos html al ul
          listOrders.forEach((element) => ordersList.appendChild(element));
        });
    });
};

const renderApp = () => {
  const token = localStorage.getItem("token");
  if (token) {
    user = JSON.parse(localStorage.getItem('user'))
    return renderOrders();
  }
  renderLogin();
};

const renderOrders = () => {
  const ordersView = document.getElementById("orders-view");
  document.getElementById("app").innerHTML = ordersView.innerHTML;

  inicializaFormulario();
  inicializaDatos();
};

const renderLogin = () => {
  const loginTemplate = document.getElementById("login-template");
  document.getElementById("app").innerHTML = loginTemplate.innerHTML;

  const loginForm = document.getElementById("login-form");
  loginForm.onsubmit = (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    fetch("https://almuerzi-backend-cml096.vercel.app/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    }).then((x) => x.json())
      .then((respuesta) => {
        localStorage.setItem("token", respuesta.token);
        ruta = "orders";
        return respuesta.token;
      })
      .then((token) => {
        return fetch("https://almuerzi-backend-cml096.vercel.app/api/auth/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            authorization: token,
          },
        })
      })
      .then(x => x.json())
      .then(fetchedUser => {
        localStorage.setItem('user', JSON.stringify(fetchedUser))
        user = fetchedUser
        renderOrders()
      });
  };
};

window.onload = () => {
  renderApp();
};
