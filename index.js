// Function to fetch all wishlists
async function getWishlists() {
    const result = await browser.storage.local.get({ wishlists: [] });
    return result.wishlists;
}

// Function to save updated wishlists
async function saveWishlists(wishlists) {
    await browser.storage.local.set({ wishlists });
}

// Function to create a new wishlist
async function createWishlist(name = `New Wishlist`) {
    const wishlists = await getWishlists();

    // Add new wishlist with a default or provided name
    const newWishlist = { name, items: [] };
    wishlists.push(newWishlist);

    await saveWishlists(wishlists);
    displayWishlists(); // Refresh display to show the new wishlist
    alert(`Created new wishlist: ${newWishlist.name}`);
}

// Function to ensure at least one default wishlist exists
async function ensureDefaultWishlist() {
    const wishlists = await getWishlists();

    // If no wishlists exist, create a default one
    if (wishlists.length === 0) {
        await createWishlist("Default");
    }
}

// Attach event listener after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const createWishlistButton = document.getElementById('create-wishlist');
    if (createWishlistButton) {
        createWishlistButton.addEventListener('click', () => {
            createWishlist(); // Call function to create a new wishlist
        });
    }

    // Initial call to ensure default wishlist
    ensureDefaultWishlist();
});

// Function to display all wishlists
async function displayWishlists() {
    await ensureDefaultWishlist(); // Ensure there's at least one wishlist
    const wishlists = await getWishlists();
    const container = document.getElementById('wishlist-container');
    container.innerHTML = '';

    wishlists.forEach((wishlist, index) => {
        const firstItem = wishlist.items[0]; // Get the first asset from the wishlist for the image

        const wishlistDiv = document.createElement('div');
        wishlistDiv.classList.add('wishlists-item');
        
        wishlistDiv.innerHTML = `
            <div class="wishlists-image">
                <a href="wishlist.html?wishlistIndex=${index}"><img src="${firstItem ? firstItem.mediaUrl : 'icons/default_wishlist.jpg'}" alt="${wishlist.name}"></a>
            </div>
            <div class="wishlists-details">
                <h3 class="wishlists-name">${wishlist.name}</h3>
                <p class="wishlists-quantity">Assets: ${wishlist.items.length}</p>
                <a href="wishlist.html?wishlistIndex=${index}" id="common-button">Open Wishlist</a>
                <button class="delete-wishlist" data-index="${index}">Delete</button>
            </div>
        `;
        container.appendChild(wishlistDiv);
    });

    // Attach event listeners after rendering
    const deleteButtons = document.querySelectorAll('.delete-wishlist');
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            deleteWishlist(index);
        });
    });
}

// Function to delete a wishlist
async function deleteWishlist(index) {
    const wishlists = await getWishlists();

    if (index < 0 || index >= wishlists.length) {
        alert("Wishlist not found.");
        return;
    }

    const wishlistName = wishlists[index].name;
    const userConfirmed = confirm(`Are you sure you want to delete the wishlist "${wishlistName}"?`);

    if (userConfirmed) {
        wishlists.splice(index, 1); // Remove the wishlist at the specified index
        await saveWishlists(wishlists);
        displayWishlists(); // Refresh display
        alert(`Deleted wishlist: ${wishlistName}`);
    }
}


// Load and display wishlists on page load
window.onload = displayWishlists;
