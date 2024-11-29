// Ensure the page you're opening is valid within the extension's context
browser.action.onClicked.addListener(() => {
    // Open the wishlist.html page in a new tab
    browser.tabs.create({ url: browser.runtime.getURL("index.html") });
});

// Listen for a message from the content script (e.g., when a user clicks "Add to Wishlist")
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'saveToWishlist') {
        saveToWishlist(message.data);
        sendResponse({ status: 'success' });
    }
});

// Listen for messages from the content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'syncWishlist') {
        // Save the data to the extension's storage
        browser.storage.local.set({ wishlist: message.data }, () => {
            console.log('Wishlist synced to extension storage:', message.data);
            sendResponse({ status: 'success' });
        });
        return true; // Keep the message channel open for sendResponse
    }
});

// Function to save an item to the wishlist in storage
function saveToWishlist(item) {
    browser.storage.local.get({ wishlist: [] }).then((result) => {
        const wishlist = result.wishlist;
        wishlist.push(item);  // Add the new item
        browser.storage.local.set({ wishlist: wishlist }).then(() => {
            console.log("Wishlist saved:", wishlist);  // Debugging log
        });
    }).catch((error) => {
        console.error("Error saving to wishlist:", error);
    });
}

// Function to get the wishlist data
function getWishlist() {
    return new Promise((resolve, reject) => {
        browser.storage.local.get({ wishlist: [] }).then((result) => {
            resolve(result.wishlist);
            console.log("Retrieved wishlist:", result.wishlist);  // Debugging log
        }).catch((error) => {
            reject("Error retrieving wishlist:", error);
        });
    });
}
