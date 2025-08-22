let AddedItemAvailable = 1;
let ModifiedQuanity = 0;

function ConfigureItemToDB(event) {
    event.preventDefault(); // Prevents form from submitting

    const itemid = document.getElementById("itemId").value;
    const itemname = document.getElementById("itemName").value;
    const itemtype = document.getElementById("itemType").value;
    const itemcost = document.getElementById("itemCost").value;
    const remarks = document.getElementById("remarks").value;

    addStoreConfigItem(itemid, itemname, itemtype, itemcost, remarks);

    // Reset form to initial state
    document.getElementById("itemConfigForm").reset();
}


  async function addStoreConfigItem(itemID, itemName, itemType, itemCost, remarks) {

    const tableName = TABLES.storeconfigitems;
    // First, check if the itemid already exists
const { data: existingItem, error: selectError } = await supabase
  .from(tableName)
  .select('itemid')
  .eq('itemid', itemID)
  .single(); // since itemid is a primary key, it should return at most one row

if (selectError && selectError.code !== 'PGRST116') {
  // Handle unexpected errors (PGRST116 = No rows found, which is okay)
  console.error('Error checking for existing item:', selectError.message);
  alert('An error occurred while checking the item ID.');
} else if (existingItem) {
  // itemid already exists
  alert('Item ID already exists. Please Enter Another Item ID.');
} else {
  const tableName = TABLES.storeconfigitems;
  // itemid does not exist, safe to insert
  const { data, error } = await supabase
    .from(tableName)
    .insert([
      {
        itemid: itemID,
        itemname: itemName,
        itemtype: itemType,
        itemcost: itemCost,
        remarks: remarks
      }
    ]);

  if (error) {
    console.error('Insert error:', error.message);
    alert('Failed to configure an item. Please try again.');
  } else {
     alert("Item Configured Successfully");
  }
}

  }

// storeinventory table
async function addStoreInventory(itemID, itemName, quantity, price, remarks) {

  const tableName = TABLES.storeinventory;
  const { data, error } = await supabase
    .from(tableName) // ✅ correct table name
    .insert([
      {
        itemid: itemID,         // ✅ match column names exactly
        itemname: itemName,
        quantity: quantity,
        price: price,
        remarks: remarks
      }
    ]);

}

//  solditemsfromstore table   
async function SoldItemsFromStoreDaily(itemID, itemName, quantity, price, pdate, ptime, username, remarks) {
    
 const tableName = TABLES.solditemsfromstore;
  const { data, error } = await supabase
    .from(tableName) // ✅ correct table name
    .insert([
      {
        itemid: itemID,         // ✅ match column names exactly
        itemname: itemName,
        soldquantity: quantity,
        soldprice: price,
        solddate : pdate,
        soldtime : ptime,
        soldby : username,
        remarks: remarks
      }
    ]);

      // Fetch storeinventory from Supabase
   

    setSoldItemQuantity(Number(itemID), Number(quantity));
    if(AddedItemAvailable == 2){
      updateStoreInventory(Number(itemID), ModifiedQuanity, price);
    }
     AddedItemAvailable = 1;
}

//
async function setSoldItemQuantity(itemID, quantity) {

  
  // Find the item in the fetched data
                      
  const existingItem = storeInventoryTableData1.find(item => item.itemid === Number(itemID));


  // If item exists, add its quantity to the passed one
  if (existingItem) {
    AddedItemAvailable = 2;
     ModifiedQuanity =  existingItem.quantity - Number(quantity);
  }
  else {
    AddedItemAvailable = 3;
    ModifiedQuanity = quantity;
  }
 
}



// addeditemstostore table
async function addItemstoStoreDaily(itemID, itemName, quantity, price, pdate, ptime, username, remarks) {
  
  const tableName = TABLES.addeditemstostore;
  const { data, error } = await supabase
    .from(tableName) // ✅ correct table name
    .insert([
      {
        itemid: itemID,         // ✅ match column names exactly
        itemname: itemName,
        quantityadded: quantity,
        price: price,
        addeddate : pdate, 
        addedtime : ptime,
        addedby : username,
        remarks: remarks
      }
    ]);

      // Fetch storeinventory from Supabase
  

  setAddedItemQuantity(itemID, quantity);
    if(AddedItemAvailable == 2){
      updateStoreInventory(Number(itemID), ModifiedQuanity, price);
    }
    else {
        addStoreInventory(itemID, itemName, quantity, price, remarks);
    }
  ModifiedQuanity = 0;
}

async function updateStoreInventory(itemID, ModifiedQuanity,price) {

  const tableName = TABLES.storeinventory;
  const { data, error } = await supabase
    .from(tableName)
    .update({ quantity: ModifiedQuanity },{ price: price})
    .eq('itemid', itemID);

  if (error) {
    console.error('Error updating inventory:', error.message);
    return { success: false, error };
  }

  console.log('Inventory updated:', data);
  return { success: true, data };
}

//
async function setAddedItemQuantity(itemID, quantity) {

  
  const existingItem = storeInventoryTableData.find(item => item.itemid === Number(itemID));

  // If item exists, add its quantity to the passed one
  if (existingItem) {
    AddedItemAvailable = 2;
     ModifiedQuanity = Number(quantity)+ existingItem.quantity;
  }
  else {
    AddedItemAvailable = 3;
  }
}
