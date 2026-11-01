const starterMedicines = [
 {id:1,name:"Paracetamol 500mg",category:"Tablets",price:25,purchasePrice:18,supplied:80,stock:80,expiry:"2027-08-30",supplier:"HealthCare Distributors"},
 {id:2,name:"Vitamin C Tablets",category:"Vitamins",price:120,purchasePrice:90,supplied:35,stock:35,expiry:"2027-06-15",supplier:"Wellness Traders"},
 {id:3,name:"Cough Relief Syrup",category:"Syrups",price:95,purchasePrice:70,supplied:8,stock:8,expiry:"2027-03-10",supplier:"MedSupply"},
 {id:4,name:"Antiseptic Cream",category:"First Aid",price:65,purchasePrice:45,supplied:24,stock:24,expiry:"2027-09-20",supplier:"HealthCare Distributors"},
 {id:5,name:"ORS Sachets",category:"First Aid",price:20,purchasePrice:14,supplied:0,stock:0,expiry:"2027-01-12",supplier:"MedSupply"},
 {id:6,name:"Multivitamin",category:"Vitamins",price:180,purchasePrice:135,supplied:42,stock:42,expiry:"2027-11-01",supplier:"Wellness Traders"}
];
let medicines = JSON.parse(localStorage.getItem("cp_meds")) || starterMedicines;
medicines.forEach(m=>{const st=starterMedicines.find(x=>x.id===m.id);if(m.supplied==null)m.supplied=st?st.stock:m.stock;if(m.purchasePrice==null)m.purchasePrice=st?st.purchasePrice:null;});
let cart = JSON.parse(localStorage.getItem("cp_cart")) || [];
let orders = JSON.parse(localStorage.getItem("cp_orders")) || [];
let prescriptions = JSON.parse(localStorage.getItem("cp_rx")) || [];
let assigned = JSON.parse(localStorage.getItem("cp_assigned")) || [];
let feedbacks = JSON.parse(localStorage.getItem("cp_feedback")) || [];
let suppliers = (JSON.parse(localStorage.getItem("cp_suppliers")) || ["HealthCare Distributors","Wellness Traders","MedSupply"]).map(x=>{x=typeof x==="string"?{name:x}:x;return {name:x.name,phone:x.phone||"",email:x.email||"",address:x.address||x.city||"",pending:Number(x.pending)||0,history:Array.isArray(x.history)?x.history:[]}});
let role = "customer", current = "home", ratingValue = 0;
const $ = id => document.getElementById(id);
const save = () => {
 localStorage.setItem("cp_meds",JSON.stringify(medicines));
 localStorage.setItem("cp_cart",JSON.stringify(cart));
 localStorage.setItem("cp_orders",JSON.stringify(orders));
 localStorage.setItem("cp_rx",JSON.stringify(prescriptions));
 localStorage.setItem("cp_assigned",JSON.stringify(assigned));
 localStorage.setItem("cp_feedback",JSON.stringify(feedbacks));
 localStorage.setItem("cp_suppliers",JSON.stringify(suppliers));
};
const esc = s => String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function currentUser(){return JSON.parse(localStorage.getItem("cp_current_user")||"null")||{name:"Guest",email:""}}
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2500)}
function addLedger(sp,change,type,text){sp.pending=Math.max(0,sp.pending+change);sp.history.unshift({id:Date.now()+Math.random(),date:new Date().toLocaleString(),type,change,text,balance:sp.pending})}
function supplierOptions(sel){const names=suppliers.map(x=>x.name);if(sel&&!names.includes(sel))names.push(sel);return names.map(n=>`<option ${n===sel?"selected":""}>${esc(n)}</option>`).join("")}
function money(n){return "₹"+Number(n).toFixed(2)}
function stars(n){return `<span class="stars-static">${"★".repeat(n)}<i>${"★".repeat(5-n)}</i></span>`}
const catIcon = {Tablets:"💊",Syrups:"🧴",Vitamins:"🍊","First Aid":"🩹","Personal Care":"🧼"};

function navItems(){
 return role==="customer"
  ? [["home","⌂  Home"],["shop","▦  Browse Medicines"],["cart","🛒  My Cart ("+cart.length+")"],["prescribed","✚  Your Prescribed Medicines"],["upload","▤  Upload Prescription"],["orders","▣  My Orders"],["feedback","★  Give Feedback"]]
  : [["dashboard","⌂  Dashboard"],["inventory","▦  Medicine Inventory"],["prescriptions","▤  Prescriptions"],["assign","✚  Assign Medicines"],["orders","▣  Customer Orders"],["feedbacks","★  Customer Feedback"],["suppliers","♙  Suppliers"],["reports","▤  Reports"]];
}
function renderNav(){
 $("navigation").innerHTML=navItems().map(x=>`<button class="${current===x[0]?'active':''}" onclick="go('${x[0]}')">${x[1]}</button>`).join("");
 const u=currentUser();
 $("roleName").textContent=role==="admin"?"Administrator":esc(u.name);
 $("roleHint").textContent=role==="admin"?"Manage your pharmacy":"Welcome to CarePlus";
 $("avatar").textContent=(role==="admin"?"A":(u.name||"C").charAt(0)).toUpperCase();
 $("helloUser").textContent="Hi, "+(role==="admin"?"Administrator":u.name);
}
function go(page){current=page;ratingValue=0;render();window.scrollTo(0,0)}
function head(title,sub,button=""){return `<div class="page-head"><div><h1>${title}</h1><div class="muted">${sub}</div></div>${button}</div>`}
function render(){renderNav();const p=$("page");if(role==="customer") customerPage(p);else adminPage(p)}

function medicineCards(list){
 return `<div class="medicine-grid">${list.map(m=>`<article class="medicine-card"><div class="med-icon t-${m.category}">${catIcon[m.category]||"💊"}</div><span class="pill">${esc(m.category)}</span><h3>${esc(m.name)}</h3><p>${m.stock>0?"In stock: "+m.stock:"Currently out of stock"} · Expiry: ${esc(m.expiry)}</p><div class="price">${money(m.price)}</div><div class="card-actions"><button class="btn light" onclick="addCart(${m.id})" ${m.stock<1?'disabled':''}>Add to Cart</button><button class="btn green" onclick="buyNow(${m.id})" ${m.stock<1?'disabled':''}>Buy Now</button></div></article>`).join("")}</div>`;
}

function customerPage(p){
 const u=currentUser();
 if(current==="home")p.innerHTML=`<div class="hero"><div class="capsule c1"></div><div class="capsule c2"></div><div class="capsule c3"></div><h1>Hello, ${esc(u.name)}. What do you need today?</h1><p>Order medicines, upload your prescription and track every order from one place.</p><button class="btn green" onclick="go('shop')">Browse medicines</button><button class="btn light" onclick="go('upload')">Upload prescription</button></div><div class="cards"><div class="stat"><small>Medicines available</small><h2>${medicines.filter(m=>m.stock>0).length}</h2></div><div class="stat"><small>Items in your cart</small><h2>${cart.length}</h2></div><div class="stat"><small>Your orders</small><h2>${orders.length}</h2></div><div class="stat"><small>Prescribed items</small><h2>${myAssigned().length}</h2></div></div><div class="panel"><h3>Popular medicines</h3>${medicineCards(medicines.filter(m=>m.stock>0).slice(0,3))}</div><div class="panel"><div class="rx-item"><div><h3 style="margin:0 0 4px">How was your experience?</h3><div class="muted" style="margin:0">Tell us what we did well and what we can improve.</div></div><button class="btn" onclick="go('feedback')">Give feedback</button></div></div>`;
 if(current==="shop")p.innerHTML=head("Browse Medicines","Search and choose a medicine")+`<div class="toolbar"><input class="search" id="medSearch" placeholder="Search medicine..." oninput="filterMeds()"><select id="categoryFilter" onchange="filterMeds()"><option value="">All categories</option>${[...new Set(medicines.map(m=>m.category))].map(c=>`<option>${esc(c)}</option>`).join("")}</select></div><div id="medResults">${medicineCards(medicines)}</div>`;
 if(current==="cart")p.innerHTML=head("My Cart","Review your selected medicines")+cartHTML();
 if(current==="prescribed")p.innerHTML=head("Your Prescribed Medicines","Medicines assigned by the pharmacy")+`<div class="notice">Please follow the instructions provided by your healthcare professional. Prescription medicines may require verification before purchase.</div>`+(myAssigned().length?myAssigned().map(a=>`<div class="panel"><div class="rx-item"><div><b>${esc(a.name)}</b><div class="muted">Quantity: ${a.qty} · Instructions: ${esc(a.instructions||"As directed by your doctor")}</div></div><button class="btn small" onclick="addAssigned(${a.id})">Add to Cart</button></div></div>`).join(""):`<div class="panel empty">No medicines have been assigned yet.</div>`);
 if(current==="upload")p.innerHTML=head("Upload Prescription","Choose a prescription image or PDF")+`<div class="panel"><form onsubmit="uploadRx(event)"><div class="field"><label>Your name</label><input id="rxName" required value="${esc(u.name==="Guest"?"":u.name)}" placeholder="Enter your name"></div><div class="field"><label>Upload file</label><input id="rxFile" type="file" accept="image/*,.pdf" required></div><button class="btn">Submit Prescription</button></form></div>`;
 if(current==="orders")p.innerHTML=head("My Orders","Your recent purchase history")+ordersHTML();
 if(current==="feedback")p.innerHTML=feedbackPage(u);
}

/* ---------- Feedback ---------- */
const ratingWords=["Tap a star to rate","Very poor","Poor","Okay","Good","Excellent"];
function feedbackPage(u){
 const mine=feedbacks.filter(f=>f.email===u.email);
 return head("Give Feedback","Your opinion helps us serve you better")+`<div class="fb-grid"><div class="panel"><h3>Share your experience</h3><form onsubmit="submitFeedback(event)"><div class="field"><label>Your name</label><input id="fbName" required value="${esc(u.name==="Guest"?"":u.name)}" placeholder="Enter your name"></div><div class="field"><label>Your rating</label><div class="stars" id="starRow">${[1,2,3,4,5].map(n=>`<button type="button" class="star" aria-label="${n} star" onclick="setRating(${n})">★</button>`).join("")}</div><div class="star-text" id="starText">${ratingWords[0]}</div></div><div class="field"><label>What is your feedback about?</label><select id="fbCategory"><option>Medicines & stock</option><option>Website experience</option><option>Orders & delivery</option><option>Prescription service</option><option>Other</option></select></div><div class="field"><label>Your message</label><textarea id="fbMessage" rows="5" required placeholder="Write your feedback here..."></textarea></div><button class="btn">Send feedback</button></form></div><div class="panel"><h3>Your previous feedback</h3>${mine.length?mine.map(feedbackItem).join(""):`<div class="empty">You have not sent any feedback yet.</div>`}</div></div>`;
}
function feedbackItem(f){return `<div class="fb-card"><div class="fb-top"><b>${esc(f.name)}</b>${stars(f.rating)}</div><span class="pill">${esc(f.category)}</span><p>${esc(f.message)}</p><div class="muted">${esc(f.date)}</div></div>`}
function setRating(n){
 ratingValue=n;
 document.querySelectorAll("#starRow .star").forEach((b,i)=>b.classList.toggle("on",i<n));
 $("starText").textContent=ratingWords[n];
}
function submitFeedback(e){
 e.preventDefault();
 if(!ratingValue){toast("Please choose a star rating");return}
 const u=currentUser();
 feedbacks.unshift({id:Date.now(),name:$("fbName").value.trim(),email:u.email,rating:ratingValue,category:$("fbCategory").value,message:$("fbMessage").value.trim(),date:new Date().toLocaleString()});
 save();ratingValue=0;toast("Thank you! Your feedback has been sent");render();
}

/* ---------- Shop ---------- */
function filterMeds(){let q=$("medSearch").value.toLowerCase(),c=$("categoryFilter").value;let list=medicines.filter(m=>m.name.toLowerCase().includes(q)&&(!c||m.category===c));$("medResults").innerHTML=list.length?medicineCards(list):`<div class="panel empty">No medicines found. Try a different name or category.</div>`}
function addCart(id){let m=medicines.find(x=>x.id===id);if(!m||m.stock<1)return toast("Medicine is out of stock");let item=cart.find(x=>x.id===id);if(item)item.qty++;else cart.push({id,qty:1});save();toast("Added to cart");render()}
function addAssigned(id){let a=assigned.find(x=>x.id===id);if(a){let m=medicines.find(x=>x.id===a.medId);if(m)addCart(m.id);else toast("Please contact the pharmacy: medicine unavailable")}}
function cartHTML(){if(!cart.length)return `<div class="panel empty">Your cart is empty. <button class="btn light" onclick="go('shop')">Browse medicines</button></div>`;let total=0;let rows=cart.map(i=>{let m=medicines.find(x=>x.id===i.id);if(!m)return "";total+=m.price*i.qty;return `<tr><td>${esc(m.name)}</td><td>${money(m.price)}</td><td><button class="btn small light" onclick="changeQty(${m.id},-1)">−</button> ${i.qty} <button class="btn small light" onclick="changeQty(${m.id},1)">+</button></td><td>${money(m.price*i.qty)}</td><td><button class="btn small red" onclick="removeCart(${m.id})">Remove</button></td></tr>`}).join("");return `<div class="panel table-wrap"><table><tr><th>Medicine</th><th>Price</th><th>Quantity</th><th>Amount</th><th></th></tr>${rows}</table><h3 style="text-align:right">Total: ${money(total)}</h3><button class="btn green" onclick="checkout()">Place Order</button></div>`}
function changeQty(id,d){let i=cart.find(x=>x.id===id),m=medicines.find(x=>x.id===id);if(!i)return;i.qty=Math.max(1,Math.min(m.stock,i.qty+d));save();render()}
function removeCart(id){cart=cart.filter(x=>x.id!==id);save();render()}
function buyNow(id){addCart(id);go("cart")}
function checkout(){if(!cart.length)return;for(let i of cart){let m=medicines.find(x=>x.id===i.id);if(!m||m.stock<i.qty)return toast("Not enough stock for "+(m?m.name:"an item"))}let total=0;cart.forEach(i=>{let m=medicines.find(x=>x.id===i.id);m.stock-=i.qty;total+=m.price*i.qty});orders.unshift({id:Date.now(),date:new Date().toLocaleString(),customer:currentUser().name,items:cart.map(i=>({...i,name:medicines.find(m=>m.id===i.id).name})),total,status:"Order received"});cart=[];save();toast("Order placed successfully");go("orders")}
function ordersHTML(){
 const list=role==="customer"?orders.filter(o=>!o.customer||o.customer===currentUser().name):orders;
 return list.length?`<div class="panel table-wrap"><table><tr><th>Order ID</th><th>Date</th>${role==="admin"?"<th>Customer</th>":""}<th>Items</th><th>Total</th><th>Status</th></tr>${list.map(o=>`<tr><td>#${String(o.id).slice(-6)}</td><td>${esc(o.date)}</td>${role==="admin"?`<td>${esc(o.customer||"-")}</td>`:""}<td>${o.items.map(i=>esc(i.name)+" × "+i.qty).join(", ")}</td><td>${money(o.total)}</td><td><span class="status">${esc(o.status)}</span></td></tr>`).join("")}</table></div>`:`<div class="panel empty">No orders yet.</div>`}
function uploadRx(e){e.preventDefault();prescriptions.unshift({id:Date.now(),name:$("rxName").value,file:$("rxFile").files[0].name,status:"Pending review"});save();toast("Prescription submitted for review");go("home")}

/* ---------- Admin ---------- */
function avgRating(){return feedbacks.length?(feedbacks.reduce((s,f)=>s+f.rating,0)/feedbacks.length).toFixed(1):"–"}
function adminPage(p){
 if(current==="dashboard")p.innerHTML=head("Admin Dashboard","Overview of your pharmacy")+`<div class="cards"><div class="stat"><small>Total medicines</small><h2>${medicines.length}</h2></div><div class="stat"><small>Low stock items</small><h2>${medicines.filter(m=>m.stock>0&&m.stock<=10).length}</h2></div><div class="stat"><small>Customer orders</small><h2>${orders.length}</h2></div><div class="stat"><small>Average rating</small><h2>${avgRating()} ★</h2></div></div><div class="grid2"><div class="panel"><h3>Quick Actions</h3><div class="toolbar"><button class="btn" onclick="go('inventory')">Add Medicine</button><button class="btn light" onclick="go('prescriptions')">View Prescriptions (${prescriptions.length})</button><button class="btn light" onclick="go('assign')">Assign Medicines</button><button class="btn light" onclick="go('feedbacks')">Read Feedback (${feedbacks.length})</button></div></div><div class="panel"><h3>Stock alerts</h3>${medicines.filter(m=>m.stock<=10).map(m=>`<p>${esc(m.name)}: <b>${m.stock===0?"Out of stock":"Low stock"}</b></p>`).join("")||"No alerts"}</div></div>`;
 if(current==="inventory")p.innerHTML=head("Medicine Inventory","Add and manage medicine stock",`<button class="btn" onclick="showAddMedicine()">+ Add Medicine</button>`)+`<div class="panel table-wrap"><table><tr><th>Name</th><th>Category</th><th>Supplier</th><th>Selling price</th><th>Purchase price</th><th>Stock</th><th>Expiry</th><th>Status</th><th>Actions</th></tr>${medicines.map(m=>`<tr><td>${esc(m.name)}</td><td>${esc(m.category)}</td><td>${esc(m.supplier||"-")}</td><td>${money(m.price)}</td><td>${m.purchasePrice!=null?money(m.purchasePrice):"-"}</td><td>${m.stock}</td><td>${esc(m.expiry)}</td><td><span class="status ${m.stock===0?'out':m.stock<=10?'low':''}">${m.stock===0?'Out of stock':m.stock<=10?'Low stock':'Available'}</span></td><td><button class="btn small green" onclick="showRestock(${m.id})">Restock</button> <button class="btn small light" onclick="showEditMedicine(${m.id})">Edit</button></td></tr>`).join("")}</table></div><div id="addForm"></div>`;
 if(current==="prescriptions")p.innerHTML=head("Customer Prescriptions","Review submitted prescription records")+`<div class="panel">${prescriptions.length?prescriptions.map(r=>`<div class="rx-item"><div><b>${esc(r.name)}</b><div class="muted">${esc(r.file)} · ${esc(r.status)}</div></div><button class="btn small" onclick="go('assign')">Assign medicines</button></div>`).join(""):`<div class="empty">No prescriptions have been submitted yet.</div>`}</div>`;
 if(current==="assign")p.innerHTML=head("Assign Prescribed Medicines","Choose a registered customer and add one or more medicines")+assignHTML();
 if(current==="orders")p.innerHTML=head("Customer Orders","All customer orders")+ordersHTML();
 if(current==="feedbacks")p.innerHTML=head("Customer Feedback","What customers are saying about CarePlus")+`<div class="cards"><div class="stat"><small>Total feedback</small><h2>${feedbacks.length}</h2></div><div class="stat"><small>Average rating</small><h2>${avgRating()} ★</h2></div><div class="stat"><small>5-star reviews</small><h2>${feedbacks.filter(f=>f.rating===5).length}</h2></div><div class="stat"><small>Low ratings (1–2)</small><h2>${feedbacks.filter(f=>f.rating<=2).length}</h2></div></div><div class="panel">${feedbacks.length?feedbacks.map(f=>feedbackItem(f)).join(""):`<div class="empty">No feedback received yet.</div>`}</div>`;
 if(current==="suppliers")p.innerHTML=head("Suppliers","Supplier contacts, supplied medicines and pending payments")+suppliersHTML();
 if(current==="reports")p.innerHTML=head("Reports","Sales and stock summary")+`<div class="cards"><div class="stat"><small>Total sales</small><h2>${money(orders.reduce((s,o)=>s+o.total,0))}</h2></div><div class="stat"><small>Total orders</small><h2>${orders.length}</h2></div><div class="stat"><small>Medicine types</small><h2>${medicines.length}</h2></div><div class="stat"><small>Low/out stock</small><h2>${medicines.filter(m=>m.stock<=10).length}</h2></div></div>`;
}
function showAddMedicine(){$("addForm").innerHTML=`<div class="panel"><h3>Add a medicine</h3><form onsubmit="addMedicine(event)"><div class="form-row"><div class="field"><label>Medicine name</label><input id="newName" required></div><div class="field"><label>Category</label><select id="newCategory"><option>Tablets</option><option>Syrups</option><option>Vitamins</option><option>First Aid</option><option>Personal Care</option></select></div><div class="field"><label>Selling price</label><input id="newPrice" type="number" min="1" required></div><div class="field"><label>Purchase price (per unit)</label><input id="newPurchase" type="number" min="0" step="any" required></div><div class="field"><label>Stock quantity</label><input id="newStock" type="number" min="0" required></div><div class="field"><label>Expiry date</label><input id="newExpiry" type="date" required></div><div class="field"><label>Supplier</label><select id="newSupplier">${supplierOptions("")}</select></div></div><button class="btn green">Save Medicine</button></form></div>`}
function showRestock(id){
 const m=medicines.find(x=>x.id===id);if(!m)return;
 $("addForm").innerHTML=`<div class="panel"><h3>Restock: ${esc(m.name)}</h3><div class="muted" style="margin:0 0 14px">Current stock: <b>${m.stock}</b></div><form onsubmit="restockMedicine(event,${id})"><div class="form-row"><div class="field"><label>Quantity received</label><input id="restockQty" type="number" min="1" required placeholder="e.g. 50"></div><div class="field"><label>Purchase price (per unit)</label><input id="restockPrice" type="number" min="0" step="any" required value="${m.purchasePrice!=null?m.purchasePrice:""}"></div></div><div class="muted" style="margin:0 0 12px">Supplier: <b>${esc(m.supplier||"-")}</b>. The purchase amount will be added to this supplier's pending payment.</div><button class="btn green">Add to stock</button> <button type="button" class="btn light" onclick="$('addForm').innerHTML=''">Cancel</button></form></div>`;
 $("addForm").scrollIntoView({behavior:"smooth"});
}
function restockMedicine(e,id){e.preventDefault();const m=medicines.find(x=>x.id===id);const q=Number($("restockQty").value);if(!m||q<1)return;const p=Number($("restockPrice").value);m.stock+=q;m.supplied=(m.supplied||0)+q;m.purchasePrice=p;const sp=suppliers.find(x=>x.name===m.supplier);if(sp&&q*p>0)addLedger(sp,q*p,"purchase",m.name+" × "+q+" @ "+money(p)+" (restock)");save();toast(m.name+" restocked: now "+m.stock+" in stock");render()}
function showEditMedicine(id){
 const m=medicines.find(x=>x.id===id);if(!m)return;
 const cats=["Tablets","Syrups","Vitamins","First Aid","Personal Care"];
 $("addForm").innerHTML=`<div class="panel"><h3>Edit medicine</h3><form onsubmit="saveEditMedicine(event,${id})"><div class="form-row"><div class="field"><label>Medicine name</label><input id="editName" required value="${esc(m.name)}"></div><div class="field"><label>Category</label><select id="editCategory">${cats.map(c=>`<option ${c===m.category?"selected":""}>${c}</option>`).join("")}</select></div><div class="field"><label>Selling price</label><input id="editPrice" type="number" min="1" required value="${m.price}"></div><div class="field"><label>Purchase price (per unit)</label><input id="editPurchase" type="number" min="0" step="any" required value="${m.purchasePrice!=null?m.purchasePrice:""}"></div><div class="field"><label>Stock quantity</label><input id="editStock" type="number" min="0" required value="${m.stock}"></div><div class="field"><label>Expiry date</label><input id="editExpiry" type="date" required value="${esc(m.expiry)}"></div><div class="field"><label>Supplier</label><select id="editSupplier">${supplierOptions(m.supplier)}</select></div></div><button class="btn green">Save changes</button> <button type="button" class="btn light" onclick="$('addForm').innerHTML=''">Cancel</button></form></div>`;
 $("addForm").scrollIntoView({behavior:"smooth"});
}
function saveEditMedicine(e,id){e.preventDefault();const m=medicines.find(x=>x.id===id);if(!m)return;m.name=$("editName").value.trim();m.category=$("editCategory").value;m.price=Number($("editPrice").value);m.purchasePrice=Number($("editPurchase").value);m.stock=Number($("editStock").value);m.expiry=$("editExpiry").value;m.supplier=$("editSupplier").value;save();toast("Medicine updated");render()}
function addMedicine(e){e.preventDefault();medicines.push({id:Date.now(),name:$("newName").value,category:$("newCategory").value,price:Number($("newPrice").value),purchasePrice:Number($("newPurchase").value),supplied:Number($("newStock").value),stock:Number($("newStock").value),expiry:$("newExpiry").value,supplier:$("newSupplier").value||"Not assigned"});const sp=suppliers.find(x=>x.name===$("newSupplier").value),amt=Number($("newStock").value)*Number($("newPurchase").value);if(sp&&amt>0)addLedger(sp,amt,"purchase",$("newName").value+" × "+$("newStock").value+" @ "+money($("newPurchase").value)+" (new medicine)");save();toast("Medicine added");render()}
function addAssignRow(){let div=document.createElement("div");div.className="form-row";div.innerHTML=`<div class="field"><label>Another medicine</label><select class="extra-med">${medicines.map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join("")}</select></div><div class="field"><label>Quantity</label><input class="extra-qty" type="number" min="1" value="1"></div>`;$("extraRows").appendChild(div)}
function myAssigned(){const u=currentUser();return assigned.filter(a=>a.customerEmail?a.customerEmail===u.email:(a.customer||"").trim().toLowerCase()===(u.name||"").trim().toLowerCase())}
function assignHTML(){
 const users=JSON.parse(localStorage.getItem("cp_users")||"[]").filter(u=>u.role==="customer");
 const form=users.length?`<div class="panel"><form onsubmit="assignMeds(event)"><div class="field"><label>Customer</label><select id="assignCustomer">${users.map(u=>`<option value="${esc(u.email)}">${esc(u.name)} (${esc(u.email)})</option>`).join("")}</select></div><div class="field"><label>Select medicine</label><select id="assignMedicine">${medicines.map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join("")}</select></div><div class="form-row"><div class="field"><label>Quantity</label><input id="assignQty" type="number" min="1" value="1" required></div><div class="field"><label>Instructions</label><input id="assignInstructions" placeholder="As directed by doctor"></div></div><button type="button" class="btn light" onclick="addAssignRow()">+ Add another medicine</button><div id="extraRows"></div><br><button class="btn green">Assign all medicines</button></form></div>`:`<div class="panel empty">No customers have registered yet. A customer must create an account before you can assign medicines.</div>`;
 const list=`<div class="panel table-wrap"><h3>Assigned medicines</h3>${assigned.length?`<table><tr><th>Customer</th><th>Medicine</th><th>Quantity</th><th>Instructions</th><th>Assigned on</th><th></th></tr>${assigned.map(a=>`<tr><td><b>${esc(a.customer)}</b>${a.customerEmail?`<div class="muted" style="margin:0">${esc(a.customerEmail)}</div>`:""}</td><td>${esc(a.name)}</td><td>${a.qty}</td><td>${esc(a.instructions||"As directed by doctor")}</td><td>${esc(a.date||"-")}</td><td><button class="btn small red" onclick="removeAssigned(${a.id})">Remove</button></td></tr>`).join("")}</table>`:`<div class="empty">No medicines have been assigned yet.</div>`}</div>`;
 return form+list;
}
function removeAssigned(id){const a=assigned.find(x=>x.id===id);if(!a)return;if(!confirm("Remove "+a.name+" assigned to "+a.customer+"?"))return;assigned=assigned.filter(x=>x.id!==id);save();toast("Assigned medicine removed");render()}
function assignMeds(e){e.preventDefault();const users=JSON.parse(localStorage.getItem("cp_users")||"[]");const cu=users.find(u=>u.email===$("assignCustomer").value);if(!cu)return toast("Please choose a customer");const ins=$("assignInstructions").value;let chosen=[{medId:Number($("assignMedicine").value),qty:Number($("assignQty").value)}];document.querySelectorAll(".extra-med").forEach((el,k)=>chosen.push({medId:Number(el.value),qty:Number(document.querySelectorAll(".extra-qty")[k].value)}));const when=new Date().toLocaleString();chosen.forEach(x=>{const m=medicines.find(y=>y.id===x.medId);if(m)assigned.push({id:Date.now()+Math.floor(Math.random()*100000),medId:m.id,name:m.name,qty:x.qty,instructions:ins,customer:cu.name,customerEmail:cu.email,date:when})});save();toast("Medicines assigned to "+cu.name);render()}
function suppliersHTML(){
 const form=`<div class="panel"><h3>Add a supplier</h3><form onsubmit="addSupplier(event)"><div class="form-row three"><div class="field"><label>Supplier / company name</label><input id="supplierName" required placeholder="Enter company name"></div><div class="field"><label>Mobile number</label><input id="supplierPhone" type="tel" inputmode="numeric" maxlength="10" pattern="[0-9]{10}" title="Enter a valid 10-digit mobile number (digits only)" oninput="this.value=this.value.replace(/\D/g,'')" required placeholder="10-digit mobile number"></div><div class="field"><label>Email ID</label><input id="supplierEmail" type="email" placeholder="name@company.com"></div></div><div class="form-row"><div class="field"><label>Company address</label><input id="supplierAddress" placeholder="Shop no., street, city"></div><div class="field"><label>Pending payment already due (₹, optional)</label><input id="supplierPending" type="number" min="0" value="0"></div></div><button class="btn">Add Supplier</button></form></div>`;
 return `<div id="supplierEditBox"></div>`+form+(suppliers.length?suppliers.map(supplierCard).join(""):`<div class="panel empty">No suppliers added yet.</div>`);
}
function supplierCard(x,i){
 const list=medicines.filter(m=>m.supplier===x.name);
 const supplied=list.reduce((t,m)=>t+(m.supplied||0),0);
 const rows=list.length?`<div class="table-wrap"><table><tr><th>Medicine</th><th>Purchase price</th><th>Total supplied</th><th>In stock now</th><th>Total purchase value</th></tr>${list.map(m=>`<tr><td>${esc(m.name)}</td><td>${m.purchasePrice!=null?money(m.purchasePrice):"Not set"}</td><td>${m.supplied||0}</td><td>${m.stock}</td><td>${money((m.purchasePrice||0)*(m.supplied||0))}</td></tr>`).join("")}</table></div>`:`<div class="muted">No medicines are linked to this supplier yet.</div>`;
 return `<div class="panel supplier-card"><div class="sup-head"><div><h3 style="margin:0">${esc(x.name)}</h3><div class="muted">Mobile: ${esc(x.phone||"-")} | Email: ${esc(x.email||"-")} | Address: ${esc(x.address||"-")}</div></div><div><button class="btn small light" onclick="showEditSupplier(${i})">Edit</button> <button class="btn small red" onclick="deleteSupplier(${i})">Delete</button></div></div><div class="sup-stats"><div><small>Medicines supplied</small><b>${list.length}</b></div><div><small>Total supplied stock</small><b>${supplied}</b></div><div><small>Pending payment</small><b class="${x.pending>0?"due":"clear"}">${money(x.pending||0)}</b></div></div>${rows}${historyHTML(x,i)}<form class="pay-form" onsubmit="paySupplier(event,${i})"><input id="pay${i}" type="number" min="1" step="any" required placeholder="Amount paid (₹)"><input id="payNote${i}" placeholder="Note (e.g. Cash, UPI)"><button class="btn small green">Record payment</button></form></div>`;
}
function showEditSupplier(i){
 const x=suppliers[i];if(!x)return;
 $("supplierEditBox").innerHTML=`<div class="panel"><h3>Edit supplier: ${esc(x.name)}</h3><form onsubmit="saveEditSupplier(event,${i})"><div class="form-row three"><div class="field"><label>Supplier / company name</label><input id="esName" required value="${esc(x.name)}"></div><div class="field"><label>Mobile number</label><input id="esPhone" type="tel" inputmode="numeric" maxlength="10" pattern="[0-9]{10}" title="Enter a valid 10-digit mobile number (digits only)" oninput="this.value=this.value.replace(/\D/g,'')" required value="${esc(x.phone)}"></div><div class="field"><label>Email ID</label><input id="esEmail" type="email" value="${esc(x.email)}"></div></div><div class="form-row"><div class="field"><label>Company address</label><input id="esAddress" value="${esc(x.address)}"></div><div class="field"><label>Pending payment (₹)</label><input id="esPending" type="number" min="0" step="any" value="${x.pending}"></div></div><button class="btn green">Save changes</button> <button type="button" class="btn light" onclick="$('supplierEditBox').innerHTML=''">Cancel</button></form></div>`;
 $("supplierEditBox").scrollIntoView({behavior:"smooth"});
}
function saveEditSupplier(e,i){
 e.preventDefault();const x=suppliers[i];if(!x)return;
 const name=$("esName").value.trim();if(!name)return;if(!/^\d{10}$/.test($("esPhone").value.trim()))return toast("Enter a valid 10-digit mobile number (digits only)");
 if(suppliers.some((y,k)=>k!==i&&y.name.toLowerCase()===name.toLowerCase()))return toast("Another supplier already has this name");
 if(name!==x.name)medicines.forEach(m=>{if(m.supplier===x.name)m.supplier=name});
 x.name=name;x.phone=$("esPhone").value.trim();x.email=$("esEmail").value.trim();x.address=$("esAddress").value.trim();const np=Math.max(0,Number($("esPending").value)||0);if(np!==x.pending)addLedger(x,np-x.pending,"adjust","Manual correction by admin");
 save();toast("Supplier updated");render();
}
function historyHTML(x,i){
 const h=x.history||[];
 const label={purchase:"Purchase",payment:"Payment",opening:"Opening",adjust:"Correction"};
 return `<details class="history"><summary>Payment history (${h.length})</summary>${h.length?`<div class="table-wrap"><table><tr><th>Date</th><th>Type</th><th>Details</th><th>Added to pending</th><th>Paid</th><th>Pending after</th><th></th></tr>${h.map(r=>`<tr><td>${esc(r.date)}</td><td><span class="status ${r.change<0?"":"low"}">${label[r.type]||"Entry"}</span></td><td>${esc(r.text)}</td><td>${r.change>0?money(r.change):"-"}</td><td>${r.change<0?money(-r.change):"-"}</td><td>${money(r.balance)}</td><td><button class="btn small red" onclick="deleteLedger(${i},'${r.id}')">Delete</button></td></tr>`).join("")}</table></div>`:`<div class="muted" style="margin:10px 0">No history yet. Restocks and payments will appear here.</div>`}</details>`;
}
function deleteLedger(i,id){
 const x=suppliers[i];if(!x)return;
 const k=x.history.findIndex(r=>String(r.id)===String(id));if(k<0)return;
 const r=x.history[k];
 if(!confirm("Delete this entry? Pending payment will be corrected automatically."))return;
 for(let n=0;n<k;n++)x.history[n].balance=Math.max(0,x.history[n].balance-r.change);
 x.pending=Math.max(0,x.pending-r.change);
 x.history.splice(k,1);save();toast("Entry deleted. Pending payment updated");render();
}
function addSupplier(e){e.preventDefault();const name=$("supplierName").value.trim();if(!name)return;if(!/^\d{10}$/.test($("supplierPhone").value.trim()))return toast("Enter a valid 10-digit mobile number (digits only)");if(suppliers.some(x=>x.name.toLowerCase()===name.toLowerCase()))return toast("This supplier already exists");const ns={name,phone:$("supplierPhone").value.trim(),email:$("supplierEmail").value.trim(),address:$("supplierAddress").value.trim(),pending:0,history:[]};suppliers.push(ns);const op=Number($("supplierPending").value)||0;if(op>0)addLedger(ns,op,"opening","Opening balance (already due)");save();toast("Supplier added");render()}
function paySupplier(e,i){e.preventDefault();const x=suppliers[i];const amt=Number($("pay"+i).value);if(!x||!(amt>0))return;if(amt>x.pending)return toast("Amount is more than the pending payment ("+money(x.pending)+")");addLedger(x,-amt,"payment","Payment"+($("payNote"+i).value.trim()?" - "+$("payNote"+i).value.trim():""));save();toast("Payment of "+money(amt)+" recorded for "+x.name);render()}
function deleteSupplier(i){const x=suppliers[i];if(!x)return;const used=medicines.filter(m=>m.supplier===x.name).length;if(used)return toast("Cannot delete: "+used+" medicine(s) use this supplier. Change their supplier first.");if(x.pending>0&&!confirm(x.name+" still has "+money(x.pending)+" pending. Delete anyway?"))return;if(!x.pending&&!confirm("Delete supplier "+x.name+"?"))return;suppliers.splice(i,1);save();toast("Supplier deleted");render()}

document.addEventListener("keydown",e=>{if(e.target&&e.target.type==="number"&&["e","E","+","-"].includes(e.key))e.preventDefault()});

/* ---------- Login ---------- */
let authMode = "login";
function showAuth(mode){
 authMode=mode;
 $("authTitle").textContent=mode==="login"?"Welcome to CarePlus":"Create your account";
 $("authSubtitle").textContent=mode==="login"?"Login to continue":"Register as a customer to use CarePlus";
 $("loginTab").classList.toggle("active",mode==="login");
 $("registerTab").classList.toggle("active",mode==="register");
 $("nameField").style.display=mode==="register"?"grid":"none";
 $("accountTypeField").style.display=mode==="register"?"none":"grid";
 $("authSubmit").textContent=mode==="login"?"Login":"Create Account";
 $("authMessage").classList.remove("show");
}
function showAuthMessage(message,ok){$("authMessage").textContent=message;$("authMessage").classList.toggle("ok",!!ok);$("authMessage").classList.add("show")}
function togglePassword(){
 const field=$("authPassword");
 field.type=field.type==="password"?"text":"password";
 document.querySelector(".show-password").textContent=field.type==="password"?"Show":"Hide";
}
function enterApp(){
 $("loginScreen").style.display="none";
 $("appLayout").style.display="flex";
 $("topActions").style.display="flex";
 current=role==="admin"?"dashboard":"home";
 render();
}
function handleAuth(e){
 e.preventDefault();
 const email=$("authEmail").value.trim().toLowerCase();
 const password=$("authPassword").value;
 if(authMode==="register"){
  const name=$("authName").value.trim();
  if(!name){showAuthMessage("Please enter your full name.");return}
  if(email==="admin@careplus.com"){showAuthMessage("This email is reserved for the administrator.");return}
  let users=JSON.parse(localStorage.getItem("cp_users")||"[]");
  if(users.some(u=>u.email===email)){showAuthMessage("An account with this email already exists. Please login.");return}
  users.push({name,email,password,role:"customer"});
  localStorage.setItem("cp_users",JSON.stringify(users));
  $("authRole").value="customer";
  showAuth("login");
  $("authEmail").value=email;
  showAuthMessage("Account created. Please login with your email and password.",true);
  return;
 }
 const selectedRole=$("authRole").value;
 if(selectedRole==="admin"){
  if(email!=="admin@careplus.com"||password!=="admin123"){showAuthMessage("Incorrect admin email or password.");return}
  role="admin";
  localStorage.setItem("cp_current_user",JSON.stringify({name:"Administrator",email:email,role:"admin"}));
 }else{
  const users=JSON.parse(localStorage.getItem("cp_users")||"[]");
  const user=users.find(u=>u.email===email&&u.password===password&&u.role==="customer");
  if(!user){showAuthMessage("Account not found. Please create a customer account first.");return}
  role="customer";
  localStorage.setItem("cp_current_user",JSON.stringify({name:user.name,email:user.email,role:user.role}));
 }
 sessionStorage.setItem("cp_logged_in","yes");
 enterApp();
}
function logout(){
 sessionStorage.removeItem("cp_logged_in");
 localStorage.removeItem("cp_current_user");
 $("appLayout").style.display="none";
 $("topActions").style.display="none";
 $("loginScreen").style.display="flex";
 $("authForm").reset();
 showAuth("login");
}
if(sessionStorage.getItem("cp_logged_in")==="yes"){
 const savedUser=JSON.parse(localStorage.getItem("cp_current_user")||"null");
 role=savedUser&&savedUser.role==="customer"?"customer":"admin";
 enterApp();
}else{
 showAuth("login");
}
