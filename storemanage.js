let AddedItemAvailable = 1;
let ModifiedQuanity = 0;



async function setNextItemId() {
    try {
        const db = window.storeSupabase || window.supabase;

        if (!db) {
            throw new Error("Supabase client is not available.");
        }

        const { data, error } = await db
            .from(TABLES.storeconfigitems)
            .select("itemid")
            .order("itemid", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        const nextId = data ? Number(data.itemid) + 1 : 1;

        document.getElementById("itemId").value = nextId;

    } catch (error) {
        console.error("Error generating next Item ID:", error);
        alert("Unable to generate the next Item ID: " + error.message);
    }
}

// Product names must be unique (case-insensitive, ignoring repeated/outer spaces).
// The database unique index is the final safeguard against concurrent or external inserts.
async function ConfigureItemToDB(event) {
  event.preventDefault();

  const itemID = Number(document.getElementById("itemId").value);
  const itemName = document.getElementById("itemName").value.trim();
  const itemType = document.getElementById("itemType").value;
  const itemCost = Number(document.getElementById("itemCost").value);
  const unit = document.getElementById("unit").value;
  const barcode = document.getElementById("barcode").value.trim();
  const remarks = document.getElementById("remarks").value.trim();
  const button = document.getElementById("saveProductButton");

  if (!Number.isInteger(itemID) || itemID <= 0) {
    alert("A valid Item ID has not been generated. Refresh the page and try again.");
    return;
  }
  if (!barcode) {
    alert("Please enter, scan, or generate a product barcode.");
    document.getElementById("barcode").focus();
    return;
  }
  if (!itemName) {
    alert("Please enter the product name.");
    document.getElementById("itemName").focus();
    return;
  }
  if (!Number.isInteger(itemCost) || itemCost < 1) {
    alert("Please enter a valid product cost (whole number greater than zero).");
    document.getElementById("itemCost").focus();
    return;
  }

  button.disabled = true;
  button.textContent = "SAVING...";

  try {
    const duplicate = await findDuplicateProductName(itemName);
    if (!duplicate.ok) throw new Error(duplicate.message);
    if (duplicate.exists) {
      throw new Error(`A product named "${itemName}" already exists (Item ID: ${duplicate.itemid}). Please use a different product name.`);
    }

    const result = await addStoreConfigItem(
      itemID, barcode, itemName, itemType, itemCost, unit, remarks
    );

    if (!result.success) {
      if (result.code === "23505") {
        const detail = `${result.message || ""} ${result.details || ""}`.toLowerCase();
        if (detail.includes("barcode") || detail.includes("idx_storeconfigitems_barcode_unique")) {
          throw new Error("This barcode is already assigned to another product. Please scan or enter a different barcode.");
        }
        if (detail.includes("itemname") || detail.includes("idx_storeconfigitems_itemname_unique")) {
          throw new Error("A product with the same name already exists. Please use a different product name.");
        }
        if (detail.includes("itemid") || detail.includes("storeconfigitems_pkey")) {
          throw new Error("This Item ID is already in use. Refresh the page and try again.");
        }
      }
      throw new Error(result.message || "Could not save the product.");
    }

    document.getElementById("itemConfigForm").reset();
    document.getElementById("itemCost").value = "1";
    document.getElementById("barcodePreview").innerHTML = "";
    if (typeof showFormStatus === "function") {
      showFormStatus("Product added successfully. You can add the next product.", "success");
    }
    await setNextItemId();
  } catch (error) {
    console.error("Configure product error:", error);
    if (typeof showFormStatus === "function") {
      showFormStatus(error.message || "Failed to add product.", "error");
    } else {
      alert(error.message || "Failed to add product.");
    }
  } finally {
    button.disabled = false;
    button.textContent = "ADD PRODUCT";
  }
}


// Normalize names consistently with the database unique index.
function normalizeProductName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

// Friendly pre-check. The database unique index remains authoritative and
// also protects product edits, imports and simultaneous insert attempts.
async function findDuplicateProductName(itemName) {
  const db = window.storeSupabase || window.supabase;
  if (!db || typeof db.from !== "function") {
    return { ok: false, message: "Supabase client is not ready. Refresh the page and try again." };
  }

  const normalized = String(itemName || "").trim().replace(/\s+/g, " ");
  // Escape PostgREST ILIKE wildcard characters so the lookup is an exact name match.
  const pattern = normalized.replace(/[\\%_]/g, "\\$&");
  const { data, error } = await db
    .from(TABLES.storeconfigitems)
    .select("itemid,itemname")
    .ilike("itemname", pattern)
    .limit(20);

  if (error) {
    console.error("Duplicate product-name check failed:", error);
    return { ok: false, message: "Could not verify whether this product name already exists. Please try again." };
  }

  const match = (data || []).find(row => normalizeProductName(row.itemname) === normalizeProductName(normalized));
  return match
    ? { ok: true, exists: true, itemid: match.itemid, itemname: match.itemname }
    : { ok: true, exists: false };
}

async function addStoreConfigItem(itemID, barcode, itemName, itemType, itemCost, unit, remarks) {
  const db = window.storeSupabase || window.supabase;
  if (!db || typeof db.from !== "function") {
    return { success: false, message: "Supabase client is not ready. Refresh the page." };
  }

  const { error } = await db
    .from(TABLES.storeconfigitems)
    .insert({
      itemid: itemID,
      barcode: barcode,
      itemname: itemName,
      itemtype: itemType,
      itemcost: itemCost,
      unit: unit,
      remarks: remarks || null,
      is_active: true
    });

  if (error) {
    console.error("Product insert error:", error);
    return {
      success: false,
      code: error.code,
      message: error.message,
      details: error.details
    };
  }
  return { success: true };
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
