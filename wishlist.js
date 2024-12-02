// Function to display wishlist items for the selected wishlist
async function displayWishlist(wishlistIndex) {
    const wishlists = await getAllWishlists();
    const wishlist = wishlists[wishlistIndex];
    const container = document.getElementById('wishlist-container');
    const wishlistNameElement = document.getElementById('wishlist-name');
    const editNameButton = document.getElementById('edit-wishlist-name');
    container.innerHTML = ''; // Clear existing content

    if (!wishlist) {
        alert("Wishlist not found.");
        window.location.href = "index.html"; // Redirect to index if not found
        return;
    }

    // Display wishlist name and attach edit functionality
    wishlistNameElement.textContent = wishlist.name || "Unnamed Wishlist";
    editNameButton.addEventListener("click", async () => {
        const newName = prompt("Enter a new name for this wishlist:", wishlist.name);
        if (newName) {
            wishlist.name = newName;
            await saveWishlist(wishlistIndex, wishlist);
            wishlistNameElement.textContent = newName; // Update the UI immediately
            alert("Wishlist name updated!");
        }
    });

    // Display wishlist items
    if (wishlist.items.length === 0) {
        container.innerHTML = '<p>No items in your wishlist.</p>';
        return;
    }

    wishlist.items.forEach((item, index) => {
        const itemDiv = document.createElement('div');
		const assetUid = item.url.split("/listings/")[1];
        itemDiv.classList.add('wishlist-item');
        itemDiv.innerHTML = `
            <a href="${item.url}" target="_blank"><img src="${item.mediaUrl}" alt="${item.title}" class="wishlist-item-image"></a>
            <h2><a href="${item.url}" target="_blank">${item.title}</a></h2>
            <p><strong>Licenses (USD):</strong></p>
            <ul>
                ${item.licenses.map(license => `
                    <li>
                        ${license.name}: 
                        ${item.discountType ? `
                            <span style="text-decoration: line-through;">$${license.price}</span> 
                            <strong>$${license.discountedPrice}</strong>
                        ` : `$${license.price}`}
                    </li>
                `).join('')}
            </ul>
            <button class="update-asset" id="update-asset" data-index="${index}">Update</button> 
            <button class="delete-item"  id="delete-wishlist" data-index="${index}">Delete</button>
        `;
        container.appendChild(itemDiv);
    });

    attachUpdateHandlers(wishlistIndex, wishlist);
    attachDeleteHandlers(wishlistIndex);
	calculateAndDisplayTotal(wishlist);
}

function attachUpdateHandlers(wishlistIndex, wishlist) {
    document.querySelectorAll('.update-asset').forEach(button => {
        button.addEventListener('click', async (event) => {
            const index = event.target.dataset.index;
            const item = wishlist.items[index];
			const loadingGif = document.getElementById('gifloading');
            
            if (!item) {
                alert("Item not found.");
                return;
            }

            const updatedItem = await fetchOnlyOneItem(item);
            if (updatedItem) {
                wishlist.items[index] = updatedItem; // Update the item
                await saveWishlist(wishlistIndex, wishlist); // Save the updated wishlist
                alert(`${item.title} updated successfully!`);
                displayWishlist(wishlistIndex); // Refresh the UI
				loadingGif.style.visibility = "hidden";
            }
        });
    });
}

function attachDeleteHandlers(wishlistIndex) {
    const deleteButtons = document.querySelectorAll('.delete-item');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const index = event.target.getAttribute('data-index');
            const wishlists = await getAllWishlists();
            const wishlist = wishlists[wishlistIndex];

            if (wishlist) {
                const itemToDelete = wishlist.items[index];
                const userConfirmed = window.confirm(`Are you sure you want to delete "${itemToDelete.title}" from your wishlist?`);

                if (userConfirmed) {
                    wishlist.items.splice(index, 1);
                    await saveWishlist(wishlistIndex, wishlist);
                    displayWishlist(wishlistIndex);
                    alert(`${itemToDelete.title} has been removed from your wishlist!`);
                }
            }
        });
    });
}


async function updatePrices() {
	const wishlistId = new URLSearchParams(window.location.search).get('wishlistIndex');
    const wishlists = await getAllWishlists();
    const wishlist = wishlists[wishlistId];
    if (!wishlist) {
        alert("Wishlist not found.");
        window.location.href = "index.html"; // Redirect to index if not found
        return;
    }

    const loadingGif = document.getElementById('gifloading');
    if (wishlist.items.length === 0) {
        alert("Your wishlist is empty. Nothing to update.");
        return;
    }

    loadingGif.style.visibility = "visible";

    const updatedItems = [];
    for (const item of wishlist.items) {
        const updatedItem = await fetchUpdatedItem(item);
        if (updatedItem) updatedItems.push(updatedItem);
		await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay between requests
    }

	

    wishlist.items = updatedItems;
    await saveWishlist(wishlistIndex, wishlist);

    loadingGif.style.visibility = "hidden";
    alert("Prices updated successfully!");
    displayWishlist(wishlistIndex);
}


// Helper function to fetch updated item data
async function fetchUpdatedItem(item) {
    try {
        const assetUid = item.url.split("/listings/")[1];
        const apiUrl = `https://www.fab.com/i/listings/${assetUid}`;
        const response = await fetch(apiUrl);

        if (!response.ok) throw new Error(`Failed to fetch data for ${item.title}`);

        const data = await response.json();
        return {
            ...item,
            licenses: data.licenses.map(license => ({
                name: license.name,
                price: license.priceTier.price,
                discountedPrice: license.priceTier.discountedPrice,
                discountPercentage: license.priceTier.discountSettings?.discountPercentage || 0,
            })),
            discountType: data.licenses[0]?.priceTier?.discountType !== null,
        };
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function fetchOnlyOneItem(item) {
    try {
        const assetUid = item.url.split("/listings/")[1];
        const apiUrl = `https://www.fab.com/i/listings/${assetUid}`;
        const response = await fetch(apiUrl);
		const loadingGif = document.getElementById('gifloading');
		loadingGif.style.visibility = "visible";

        if (!response.ok) throw new Error(`Failed to fetch data for ${item.title}`);

        const data = await response.json();
        return {
            ...item,
            licenses: data.licenses.map(license => ({
                name: license.name,
                price: license.priceTier.price,
                discountedPrice: license.priceTier.discountedPrice,
                discountPercentage: license.priceTier.discountSettings?.discountPercentage || 0,
            })),
            discountType: data.licenses[0]?.priceTier?.discountType !== null,
        };
    } catch (error) {
        console.error(error);
        alert(`Failed to update ${item.title}.`);
		loadingGif.style.visibility = "hidden";
        return null;
    }
}

// Function to retrieve a wishlist by ID
async function getWishlistById(wishlistId) {
    const allWishlists = await getAllWishlists();
    return allWishlists[wishlistId];
}

async function saveWishlist(wishlistIndex, wishlist) {
    const allWishlists = await getAllWishlists();
    allWishlists[wishlistIndex] = wishlist;
    await browser.storage.local.set({ wishlists: allWishlists });
}

async function getAllWishlists() {
    const result = await browser.storage.local.get({ wishlists: [] });
    return result.wishlists;
}

// Load and display the wishlist when the page loads
const urlParams = new URLSearchParams(window.location.search);
const wishlistIndex = parseInt(urlParams.get('wishlistIndex'), 10);
if (!isNaN(wishlistIndex)) {
    displayWishlist(wishlistIndex);
}

// Function to import the wishlist data into the current wishlist
async function importWishlist() {
    try {
        const wishlistId = new URLSearchParams(window.location.search).get('wishlistIndex');
        if (!wishlistId) {
            alert("Wishlist not found.");
            return;
        }

        // Create file input element for user to choose file
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const importedData = JSON.parse(e.target.result);
                        const allWishlists = await getAllWishlists();

                        // Check if the current wishlist exists
                        const currentWishlist = allWishlists[wishlistId];
                        if (!currentWishlist) {
                            alert("Current wishlist not found.");
                            return;
                        }

                        // Add the imported items to the current wishlist
                        currentWishlist.items.push(...importedData.items);

                        // Save the updated wishlist back to storage
                        allWishlists[wishlistId] = currentWishlist;
                        await browser.storage.local.set({ wishlists: allWishlists });

                        alert('Wishlist imported successfully!');
                        displayWishlist(wishlistId); // Refresh the current wishlist display
                    } catch (err) {
                        console.error('Error importing wishlist:', err);
                        alert('Failed to import wishlist. Invalid file format.');
                    }
                };
                reader.readAsText(file);
            }
        });

        // Trigger file input dialog
        fileInput.click();
    } catch (err) {
        console.error('Error importing wishlist:', err);
        alert('An error occurred while importing the wishlist.');
    }
}


// Function to export the current wishlist data
async function exportWishlist() {
    try {
        const wishlistId = new URLSearchParams(window.location.search).get('wishlistIndex');
        if (!wishlistId) {
            alert("Wishlist not found.");
            return;
        }

        const allWishlists = await getAllWishlists();
        const wishlist = allWishlists[wishlistId];
        if (!wishlist) {
            alert("Wishlist not found.");
            return;
        }

        const dataStr = JSON.stringify(wishlist, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${wishlist.name || 'wishlist'}.json`;
        link.click();

        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Error exporting wishlist:', err);
        alert('An error occurred while exporting the wishlist.');
    }
}

// Function to clear the wishlist (empty it)
async function clearWishlist() {
    if (window.confirm("Are you sure you want to clear this wishlist?")) {
        try {
            const wishlistId = new URLSearchParams(window.location.search).get('wishlistIndex');
            if (wishlistId) {
                const allWishlists = await getAllWishlists();
                const wishlist = allWishlists[wishlistId];
                wishlist.items = [];
                await saveWishlist(wishlistId, wishlist);
                alert('Wishlist cleared!');
                displayWishlist(wishlistId); // Refresh the wishlist display
            }
        } catch (err) {
            console.error('Error clearing wishlist:', err);
            alert('An error occurred while clearing the wishlist.');
        }
    }
}


// Attach event listeners for buttons
document.getElementById("update-prices").addEventListener("click", updatePrices);
document.getElementById('import-wishlist').addEventListener('click', importWishlist);
document.getElementById('export-wishlist').addEventListener('click', exportWishlist);
document.getElementById('clear-wishlist').addEventListener('click', clearWishlist);


async function calculateAndDisplayTotal(wishlist) {
    const totals = {};

    // Initialize totals for each license type
    wishlist.items.forEach((item) => {
        item.licenses.forEach((license) => {
            const priceKey = item.discountType ? 'discountedPrice' : 'price';
            totals[license.name] = (totals[license.name] || 0) + license[priceKey];
        });
    });

    // Format and display totals
    const totalContainer = document.getElementById('total-prices');
    totalContainer.innerHTML = '<h3>Total Prices by License:</h3>';
    for (const [licenseName, totalPrice] of Object.entries(totals)) {
        const formattedTotal = `$${totalPrice.toFixed(2)}`;
        const totalElement = document.createElement('p');
        totalElement.textContent = `${licenseName}: ${formattedTotal}`;
        totalContainer.appendChild(totalElement);
    }

}
