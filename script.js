let allProducts = [];
let cart = {};
let detailQty = 1;

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  if (name === 'cart') renderCart();
  window.scrollTo(0, 0);
}

function starsHtml(rating) {
  let s = '';
  for (let i = 1; i <= 5; i++) s += i <= Math.round(rating) ? '★' : '☆';
  return s;
}

async function loadProducts() {
  try {
    const res = await fetch('https://dummyjson.com/products?limit=194');
    const data = await res.json();
    allProducts = data.products;
    const cats = [...new Set(allProducts.map(p => p.category))].sort();
    const sel = document.getElementById('category-filter');
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c.charAt(0).toUpperCase() + c.slice(1).replace(/-/g, ' ');
      sel.appendChild(opt);
    });
    filterProducts();
  } catch (e) {
    document.getElementById('products-grid').innerHTML = '<div class="loading">Failed to load products. Check your connection.</div>';
  }
}

function filterProducts() {
  const q = document.getElementById('search-input').value.toLowerCase();
  const cat = document.getElementById('category-filter').value;
  const sort = document.getElementById('sort-filter').value;

  let filtered = allProducts.filter(p => {
    const matchQ = p.title.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
    const matchCat = !cat || p.category === cat;
    return matchQ && matchCat;
  });

  if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
  else if (sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);
  else if (sort === 'discount') filtered.sort((a, b) => b.discountPercentage - a.discountPercentage);

  document.getElementById('product-count').textContent = filtered.length + ' products';
  renderGrid(filtered);
}

function renderGrid(products) {
  const grid = document.getElementById('products-grid');
  if (!products.length) {
    grid.innerHTML = '<div class="loading">No products found.</div>';
    return;
  }
  grid.innerHTML = products.map(p => `
    <div class="product-card" onclick="showProduct(${p.id})">
      <img class="product-img" src="${p.thumbnail}" alt="${p.title}" loading="lazy">
      <div class="product-info">
        <div class="product-category">${p.category}</div>
        <div class="product-name">${p.title}</div>
        <div class="product-price-row">
          <span class="product-price">$${p.price.toFixed(2)}</span>
          <span class="product-rating"><span style="color:#f59e0b">★</span> ${p.rating.toFixed(1)}</span>
        </div>
        ${p.discountPercentage >= 5 ? `<span class="discount-badge">${Math.round(p.discountPercentage)}% off</span>` : ''}
        <button class="add-btn" onclick="event.stopPropagation(); addToCart(${p.id})">
          + Add to cart
        </button>
      </div>
    </div>
  `).join('');
}

async function showProduct(id) {
  showPage('product');
  const container = document.getElementById('product-detail-content');
  container.innerHTML = '<div class="loading">Loading product details…</div>';
  detailQty = 1;

  try {
    const res = await fetch(`https://dummyjson.com/products/${id}`);
    const p = await res.json();

    const origPrice = (p.price / (1 - p.discountPercentage / 100)).toFixed(2);
    const savings = (parseFloat(origPrice) - p.price).toFixed(2);

    container.innerHTML = `
      <div class="product-detail">
        <div>
          <div class="product-gallery">
            <img id="main-img" src="${p.images && p.images[0] ? p.images[0] : p.thumbnail}" alt="${p.title}">
          </div>
          ${p.images && p.images.length > 1 ? `
            <div class="thumbnails">
              ${p.images.map(img => `
                <img src="${img}" alt="thumbnail" onclick="document.getElementById('main-img').src='${img}'">
              `).join('')}
            </div>
          ` : ''}
        </div>
        <div class="product-meta">
          <div class="category">${p.category}</div>
          <h1>${p.title}</h1>
          <div class="rating-row">
            <span class="stars">${starsHtml(p.rating)}</span>
            <span style="font-size:14px;font-weight:600">${p.rating.toFixed(1)}</span>
            <span class="review-count">(${p.reviews ? p.reviews.length : 0} reviews)</span>
          </div>
          <div class="price-block">
            <div class="price-main">
              $${p.price.toFixed(2)}
              <span class="discount-badge">${Math.round(p.discountPercentage)}% off</span>
            </div>
            <div>
              <span class="price-original">$${origPrice}</span>
              <span class="price-save">You save $${savings}</span>
            </div>
          </div>
          <div class="stock-info ${p.stock < 10 ? 'stock-low' : 'stock-ok'}">
            ${p.stock < 10 ? '⚠ Only ' + p.stock + ' left in stock!' : '✓ ' + p.stock + ' in stock'}
          </div>
          <p class="product-desc">${p.description}</p>
          ${p.tags && p.tags.length ? `
            <div class="tag-row">
              ${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}
            </div>
          ` : ''}
          <div class="qty-row">
            <span class="qty-label">Quantity:</span>
            <button class="qty-btn" onclick="changeQty(-1)">−</button>
            <span class="qty-val" id="qty-display">1</span>
            <button class="qty-btn" onclick="changeQty(1)">+</button>
          </div>
          <button class="add-to-cart-btn" onclick="addToCart(${p.id}, detailQty)">
            <i class="ti ti-shopping-cart"></i> Add to cart
          </button>
        </div>
      </div>

      <div class="specs-section">
        <h2>Product details</h2>
        <div class="specs-grid">
          <div class="spec-item"><div class="spec-label">Brand</div><div class="spec-val">${p.brand || '—'}</div></div>
          <div class="spec-item"><div class="spec-label">SKU</div><div class="spec-val">${p.sku || '—'}</div></div>
          <div class="spec-item"><div class="spec-label">Weight</div><div class="spec-val">${p.weight ? p.weight + 'g' : '—'}</div></div>
          <div class="spec-item"><div class="spec-label">Availability</div><div class="spec-val">${p.availabilityStatus || '—'}</div></div>
          <div class="spec-item"><div class="spec-label">Min. order</div><div class="spec-val">${p.minimumOrderQuantity || 1}</div></div>
          <div class="spec-item"><div class="spec-label">Warranty</div><div class="spec-val">${p.warrantyInformation || '—'}</div></div>
        </div>
      </div>

      ${p.reviews && p.reviews.length ? `
        <div class="reviews-section">
          <h2 style="font-size:16px;font-weight:600;margin-bottom:12px">Customer reviews</h2>
          ${p.reviews.map(r => `
            <div class="review-card">
              <div class="review-header">
                <span class="reviewer-name">${r.reviewerName}</span>
                <span class="review-stars">${starsHtml(r.rating)}</span>
              </div>
              <p class="review-text">${r.comment}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  } catch (e) {
    container.innerHTML = '<div class="loading">Failed to load product. Please try again.</div>';
  }
}

function changeQty(delta) {
  detailQty = Math.max(1, detailQty + delta);
  const el = document.getElementById('qty-display');
  if (el) el.textContent = detailQty;
}

function addToCart(id, qty = 1) {
  const prod = allProducts.find(p => p.id === id);
  if (!prod) return;
  if (cart[id]) {
    cart[id].qty += qty;
  } else {
    cart[id] = { ...prod, qty };
  }
  updateCartUI();
  showToast(prod.title.length > 30 ? prod.title.slice(0, 30) + '…' : prod.title + ' added to cart');
}

function updateCartUI() {
  const total = Object.values(cart).reduce((s, p) => s + p.qty, 0);
  document.getElementById('cart-badge').textContent = total;
  document.getElementById('nav-count').textContent = total ? total + ' item' + (total > 1 ? 's' : '') : '';
}

function renderCart() {
  const items = Object.values(cart);
  const title = document.getElementById('cart-items-title');
  title.textContent = items.length ? items.length + ' item' + (items.length > 1 ? 's' : '') + ' in cart' : 'Cart items';

  const list = document.getElementById('cart-items-list');
  if (!items.length) {
    list.innerHTML = `
      <div class="empty-cart">
        <i class="ti ti-shopping-cart-off"></i>
        <p style="font-size:16px;font-weight:500;margin-bottom:6px">Your cart is empty</p>
        <p style="font-size:14px">Add items to get started</p>
        <button class="browse-btn" onclick="showPage('listing')">Browse products</button>
      </div>
    `;
    updateBill([]);
    return;
  }

  list.innerHTML = items.map(p => `
    <div class="cart-item">
      <img src="${p.thumbnail}" alt="${p.title}">
      <div class="cart-item-info">
        <div class="cart-item-name">${p.title}</div>
        <div class="cart-item-cat">${p.category}</div>
        <div class="cart-item-controls">
          <div class="cart-qty">
            <button onclick="updateCartQty(${p.id}, -1)">−</button>
            <span>${p.qty}</span>
            <button onclick="updateCartQty(${p.id}, 1)">+</button>
          </div>
          <span class="cart-item-price">$${(p.price * p.qty).toFixed(2)}</span>
        </div>
        <button class="remove-item" onclick="removeFromCart(${p.id})">
          <i class="ti ti-trash"></i> Remove
        </button>
      </div>
    </div>
  `).join('');

  updateBill(items);
}

function updateCartQty(id, delta) {
  if (!cart[id]) return;
  cart[id].qty = Math.max(1, cart[id].qty + delta);
  updateCartUI();
  renderCart();
}

function removeFromCart(id) {
  delete cart[id];
  updateCartUI();
  renderCart();
}

function updateBill(items) {
  const subtotal = items.reduce((s, p) => s + (p.price / (1 - p.discountPercentage / 100)) * p.qty, 0);
  const total = items.reduce((s, p) => s + p.price * p.qty, 0);
  const discount = subtotal - total;
  const delivery = total > 0 && total < 50 ? 4.99 : 0;
  const grandTotal = total + delivery;

  document.getElementById('bill-subtotal').textContent = '$' + subtotal.toFixed(2);
  document.getElementById('bill-discount').textContent = '-$' + discount.toFixed(2);
  document.getElementById('bill-delivery').textContent = delivery === 0 ? (total > 0 ? 'FREE' : '$0.00') : '$' + delivery.toFixed(2);
  document.getElementById('bill-total').textContent = '$' + grandTotal.toFixed(2);

  const note = document.getElementById('delivery-note');
  if (total > 0 && total < 50) {
    note.textContent = 'Add $' + (50 - total).toFixed(2) + ' more for free delivery!';
  } else if (total >= 50) {
    note.textContent = '🎉 You have free delivery!';
  } else {
    note.textContent = '';
  }

  const btn = document.getElementById('checkout-btn');
  btn.disabled = !items.length;
}

function checkout() {
  showToast('Order placed successfully! Thank you 🎉');
  cart = {};
  updateCartUI();
  setTimeout(() => { renderCart(); showPage('listing'); }, 1500);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 2500);
}

loadProducts();
