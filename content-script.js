const fetchAssetDataAndSave = async (selectedWishlistIndex) => {
    try {
        // Get the asset UID from the current URL
        const assetUid = window.location.pathname.split("/listings/")[1];
        if (!assetUid) throw new Error("Asset UID not found in URL.");

        // Construct the JSON API URL
        const apiUrl = `https://www.fab.com/i/listings/${assetUid}`;

        // Fetch the asset JSON data
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`Failed to fetch asset data: ${response.statusText}`);

        const assetData = await response.json();

        // Extract the required data
        const assetUrl = `https://www.fab.com/listings/${assetUid}`;
        const title = assetData.title || "Unknown Title";
        const mediaUrl = assetData.medias[0]?.images[2]?.url || "No media available";
        const licenses = assetData.licenses.map((license) => ({
            name: license.name,
            price: license.priceTier.price,
            discountedPrice: license.priceTier.discountedPrice,
            discountPercentage: license.priceTier.discountSettings?.discountPercentage || 0,
        }));

        // Check if the first license has a discount
        const discountType = assetData.licenses[0]?.priceTier?.discountType !== null;

        const wishlistItem = {
            url: assetUrl,
            title,
            mediaUrl,
            licenses,
            discountType,
        };

        // Get all wishlists
        const wishlists = await getWishlists();

        // Ensure the selected wishlist index is valid
        if (selectedWishlistIndex < 0 || selectedWishlistIndex >= wishlists.length) {
            alert("Invalid wishlist selection.");
            return;
        }

        const selectedWishlist = wishlists[selectedWishlistIndex];

        // Check if the item already exists in the selected wishlist
        const itemExists = selectedWishlist.items.some((item) => item.url === wishlistItem.url);
        if (itemExists) {
            alert("This item is already in the selected wishlist.");
            return;
        }

        // Add the new item to the selected wishlist
        selectedWishlist.items.push(wishlistItem);

        // Save the updated wishlists
        await browser.storage.local.set({ wishlists });
        alert(`Added "${title}" to wishlist: ${selectedWishlist.name}`);
    } catch (error) {
        console.error("Error fetching or saving asset data:", error);
        alert("Failed to add to Wishlist.");
    }
};

// Function to get all wishlists
async function getWishlists() {
    const result = await browser.storage.local.get({ wishlists: [] });
    return result.wishlists;
}

const addWishlistButton = async () => {
    // Try to get the rootDiv by the new class name

	    // Check if the "Add to Wishlist" button already exists
    if (document.getElementById("WishlistButton")) {
        console.log("Wishlist button already exists, skipping...");
        return; // Exit early if the button already exists
    }

    const rootDiv = document.getElementsByClassName("fabkit-Surface-root fabkit-Surface--emphasis-background-elevated-low-transparent fabkit-scale--gutterX-spacing-8 fabkit-scale--gutterY-spacing-8 fabkit-Stack-root fabkit-scale--gapX-spacing-4")[0];

    // If rootDiv is not found or dataset is undefined, exit early
    if (!rootDiv || !rootDiv.dataset) {
        console.log("Root div not found or dataset is unavailable.");
        return;
    }

    if (!rootDiv.dataset.wishlistButtonAdded) {
        // Create the dropdown for wishlist selection
        const selectDropdown = document.createElement("select");
        selectDropdown.className = "fabkit-Button-root fabkit-Button--md fabkit-Button--warning";
        selectDropdown.style.marginBottom = "10px";

        // Fetch all wishlists and populate the dropdown
        const wishlists = await getWishlists();
        wishlists.forEach((wishlist, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = wishlist.name;
            selectDropdown.appendChild(option);
        });

        // Create the "Add to Wishlist" button
        const wishlistButton = document.createElement("button");
        wishlistButton.textContent = "❤ Add to Wishlist";
        wishlistButton.className = "fabkit-Button-root fabkit-Button--md fabkit-Button--success";
        wishlistButton.id = "WishlistButton"; // Set the ID so we can check it
        wishlistButton.addEventListener("click", () => {
            const selectedIndex = selectDropdown.value;
            fetchAssetDataAndSave(parseInt(selectedIndex));
        });
    if (!document.getElementById("WishlistButton")) {
        // Append dropdown and button to the rootDiv
        rootDiv.dataset.wishlistButtonAdded = "true";
        rootDiv.appendChild(selectDropdown);
        rootDiv.appendChild(wishlistButton);
	}

        console.log("Wishlist button and dropdown added!");
    }
};

// MutationObserver to handle SPA navigation
const observer = new MutationObserver(() => {
    addWishlistButton();
});

// Start observing the document for changes in the DOM
observer.observe(document.body, { childList: true, subtree: true });

// Initial run
window.onload = () => {
    addWishlistButton();
};
