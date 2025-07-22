// Get DOM elements
const addGameBtn = document.getElementById('addGameBtn');
const exportDataBtn = document.getElementById('exportDataBtn');
const viewHistoryBtn = document.getElementById('viewHistoryBtn');
const platformFilter = document.getElementById('platformFilter');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchInput');
const sortOption = document.getElementById('sortOption');
const sortOrder = document.getElementById('sortOrder');

const gameModal = document.getElementById('gameModal');
const gameModalContent = document.getElementById('gameModalContent');
const modalTitle = document.getElementById('modalTitle');
const gameForm = document.getElementById('gameForm');
const cancelBtn = document.getElementById('cancelBtn');
const inventoryList = document.getElementById('inventoryList');
const noGamesMessage = document.getElementById('noGamesMessage');
const photoFileInput = document.getElementById('photoFile');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');

const confirmationModal = document.getElementById('confirmationModal');
const confirmationModalContent = document.getElementById('confirmationModalContent');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

const activityHistoryModal = document.getElementById('activityHistoryModal');
const activityHistoryModalContent = document.getElementById('activityHistoryModalContent');
const activityLog = document.getElementById('activityLog');
const noActivityMessage = document.getElementById('noActivityMessage');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');

// Dashboard elements
const totalAvailableValueEl = document.getElementById('totalAvailableValue');
const totalGamesInCollectionEl = document.getElementById('totalGamesInCollection');
const soldItemsEl = document.getElementById('soldItems');
const totalSalesEl = document.getElementById('totalSales');
const lowStockItemsEl = document.getElementById('lowStockItems');
const platformChartCanvas = document.getElementById('platformChart');
const noChartDataMessage = document.getElementById('noChartDataMessage');

// File management elements
const saveFileNameInput = document.getElementById('saveFileNameInput');
const importDataBtn = document.getElementById('importDataBtn');
const importFileInput = document.getElementById('importFileInput');

// Pagination elements
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageInfo = document.getElementById('pageInfo');


let games = [];
let activityHistory = [];
let editingGameId = null;
let gameToDeleteId = null;
let platformChartInstance = null;

const gamesPerPage = 16;
let currentPage = 1;

// --- Utility Functions ---

/**
 * Generates a unique ID for new games.
 * @returns {string} A unique ID.
 */
function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Formats a number as Philippine Peso currency with thousands separators.
 * @param {number} amount - The number to format.
 * @returns {string} The formatted currency string (e.g., "₱1,234.56").
 */
function formatPhilippinePeso(amount) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Saves the current games array to local storage.
 */
function saveGamesToLocalStorage() {
    localStorage.setItem('gameCollection', JSON.stringify(games));
}

/**
 * Loads games from local storage when the page loads.
 */
function loadGamesFromLocalStorage() {
    const storedGames = localStorage.getItem('gameCollection');
    if (storedGames) {
        games = JSON.parse(storedGames);
        // Ensure 'isSold' property exists for older entries
        games.forEach(game => {
            if (typeof game.isSold === 'undefined') {
                game.isSold = false;
            }
        });
    }
    renderGames();
}

/**
 * Saves the current activity history array to local storage.
 */
function saveActivityHistoryToLocalStorage() {
    localStorage.setItem('gameActivityHistory', JSON.stringify(activityHistory));
}

/**
 * Loads activity history from local storage.
 */
function loadActivityHistoryFromLocalStorage() {
    const storedHistory = localStorage.getItem('gameActivityHistory');
    if (storedHistory) {
        activityHistory = JSON.parse(storedHistory);
    }
}

/**
 * Adds an event to the activity history.
 * @param {string} type - The type of event ('added', 'sold', 'available', 'edited', 'deleted').
 * @param {object} game - The game object related to the event.
 */
function addActivityEvent(type, game) {
    const event = {
        id: generateUniqueId(),
        type: type,
        gameName: game.name,
        platform: game.platform,
        timestamp: new Date().toISOString()
    };
    activityHistory.push(event);
    saveActivityHistoryToLocalStorage();
}

/**
 * Displays a modal with a fade-in and scale-up effect.
 * @param {HTMLElement} modalElement - The modal container element.
 * @param {HTMLElement} contentElement - The modal content element.
 */
function showModal(modalElement, contentElement) {
    modalElement.classList.remove('hidden');
    void modalElement.offsetWidth;
    contentElement.classList.remove('scale-95', 'opacity-0');
    contentElement.classList.add('scale-100', 'opacity-100');
}

/**
 * Hides a modal with a fade-out and scale-down effect.
 * @param {HTMLElement} modalElement - The modal container element.
 * @param {HTMLElement} contentElement - The modal content element.
 */
function hideModal(modalElement, contentElement) {
    contentElement.classList.remove('scale-100', 'opacity-100');
    contentElement.classList.add('scale-95', 'opacity-0');
    contentElement.addEventListener('transitionend', () => {
        modalElement.classList.add('hidden');
    }, { once: true });
}

// --- Event Handlers ---

/**
 * Handles the click event for the "Add New Game" button.
 */
addGameBtn.addEventListener('click', () => {
    modalTitle.textContent = 'Add New Game';
    gameForm.reset();
    editingGameId = null;
    imagePreviewContainer.classList.add('hidden');
    imagePreview.src = '';
    photoFileInput.value = '';
    showModal(gameModal, gameModalContent);
});

/**
 * Handles the click event for the "Export Data" button.
 */
exportDataBtn.addEventListener('click', () => {
    if (games.length === 0) {
        console.log("No games to export!");
        return;
    }

    const fileName = (saveFileNameInput.value.trim() || 'game_inventory') + '.json';
    const dataStr = JSON.stringify(games, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

/**
 * Handles the click event for the "Import Data" button.
 */
importDataBtn.addEventListener('click', () => {
    importFileInput.click();
});

/**
 * Handles the change event for the hidden file input (when a file is selected for import).
 */
importFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedGames = JSON.parse(e.target.result);
                if (Array.isArray(importedGames)) {
                    games = importedGames;
                    saveGamesToLocalStorage();
                    currentPage = 1;
                    renderGames();
                    activityHistory = [];
                    saveActivityHistoryToLocalStorage();
                    console.log("Game data imported successfully!");
                } else {
                    console.error("Imported file does not contain a valid JSON array.");
                }
            } catch (error) {
                console.error("Error parsing imported JSON file:", error);
            }
        };
        reader.onerror = () => {
            console.error("Error reading file:", reader.error);
        };
        reader.readAsText(file);
    }
    importFileInput.value = '';
});


/**
 * Handles the click event for the "View Activity" button.
 */
viewHistoryBtn.addEventListener('click', () => {
    renderActivityHistory();
    showModal(activityHistoryModal, activityHistoryModalContent);
});

/**
 * Handles the click event for the "Close" button in the activity history modal.
 */
closeHistoryBtn.addEventListener('click', () => {
    hideModal(activityHistoryModal, activityHistoryModalContent);
});

/**
 * Handles the change event for the platform filter dropdown.
 */
platformFilter.addEventListener('change', () => { currentPage = 1; renderGames(); });

/**
 * Handles the change event for the status filter dropdown.
 */
statusFilter.addEventListener('change', () => { currentPage = 1; renderGames(); });

/**
 * Handles input events on the search bar to filter games.
 */
searchInput.addEventListener('input', () => { currentPage = 1; renderGames(); });

/**
 * Handles change events on the sort option dropdowns to re-sort games.
 */
sortOption.addEventListener('change', () => { currentPage = 1; renderGames(); });
sortOrder.addEventListener('change', () => { currentPage = 1; renderGames(); });

// Pagination button event listeners
prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderGames();
    }
});

nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(getFilteredAndSortedGames().length / gamesPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderGames();
    }
});


/**
 * Handles the click event for the "Cancel" button in the game modal.
 */
cancelBtn.addEventListener('click', () => {
    hideModal(gameModal, gameModalContent);
});

/**
 * Handles changes to the photo file input to display a preview.
 */
photoFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreviewContainer.classList.remove('hidden');
        };
        reader.onerror = () => {
            imagePreview.src = `https://placehold.co/400x200/cccccc/333333?text=Image+Read+Error`;
            imagePreviewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } else {
        imagePreviewContainer.classList.add('hidden');
        imagePreview.src = '';
    }
});

/**
 * Handles the submission of the game form (add/edit).
 * @param {Event} event - The form submission event.
 */
gameForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const gameName = document.getElementById('gameName').value.trim();
    const platform = document.getElementById('platform').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const price = parseFloat(document.getElementById('price').value);
    const description = document.getElementById('description').value.trim();

    let photoData = imagePreview.src;
    if (photoData.startsWith('https://placehold.co')) {
        photoData = '';
    }


    if (!gameName || !platform || isNaN(quantity) || isNaN(price)) {
        console.error("Please fill in all required fields correctly.");
        return;
    }

    if (editingGameId) {
        const gameIndex = games.findIndex(game => game.id === editingGameId);
        if (gameIndex !== -1) {
            const originalGame = { ...games[gameIndex] };

            games[gameIndex] = {
                ...games[gameIndex],
                name: gameName,
                platform: platform,
                quantity: quantity,
                price: price,
                photoUrl: photoData,
                description: description,
                lastUpdated: new Date().toISOString()
            };

            const hasChanged = originalGame.name !== games[gameIndex].name ||
                               originalGame.platform !== games[gameIndex].platform ||
                               originalGame.quantity !== games[gameIndex].quantity ||
                               originalGame.price !== games[gameIndex].price ||
                               originalGame.description !== games[gameIndex].description ||
                               originalGame.photoUrl !== games[gameIndex].photoUrl;

            if (hasChanged) {
                addActivityEvent('edited', games[gameIndex]);
            }
        }
    } else {
        const newGame = {
            id: generateUniqueId(),
            name: gameName,
            platform: platform,
            quantity: quantity,
            price: price,
            photoUrl: photoData,
            description: description,
            dateAdded: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            isSold: false
        };
        games.push(newGame);
        addActivityEvent('added', newGame);
    }

    saveGamesToLocalStorage();
    renderGames();
    hideModal(gameModal, gameModalContent);
});

/**
 * Handles the click event for the "Cancel" button in the confirmation modal.
 */
confirmCancelBtn.addEventListener('click', () => {
    hideModal(confirmationModal, confirmationModalContent);
    gameToDeleteId = null;
});

/**
 * Handles the click event for the "Delete" button in the confirmation modal.
 */
confirmDeleteBtn.addEventListener('click', () => {
    if (gameToDeleteId) {
        const gameToDelete = games.find(game => game.id === gameToDeleteId);
        if (gameToDelete) {
            addActivityEvent('deleted', gameToDelete);
        }
        games = games.filter(game => game.id !== gameToDeleteId);
        saveGamesToLocalStorage();
        currentPage = 1;
        renderGames();
    }
    hideModal(confirmationModal, confirmationModalContent);
    gameToDeleteId = null;
});

/**
 * Toggles the 'isSold' status of a game.
 * @param {string} id - The ID of the game to toggle.
 */
function toggleSoldStatus(id) {
    const gameIndex = games.findIndex(game => game.id === id);
    if (gameIndex !== -1) {
        const game = games[gameIndex];
        game.isSold = !game.isSold;
        if (game.isSold) {
            addActivityEvent('sold', game);
        } else {
            addActivityEvent('available', game);
        }
        saveGamesToLocalStorage();
        renderGames();
    }
}

// --- Dashboard Update Function ---
/**
 * Calculates and updates the dashboard statistics and chart.
 */
function updateDashboard() {
    let totalAvailableStocks = 0;
    let totalSoldItems = 0;
    let totalAvailableValue = 0;
    let totalSalesValue = 0;
    let totalGamesInCollection = 0;
    let lowStockItemsCount = 0;
    const platformCounts = {};

    games.forEach(game => {
        totalGamesInCollection += game.quantity;

        if (game.isSold) {
            totalSoldItems += game.quantity;
            totalSalesValue += (game.quantity * game.price);
        } else {
            totalAvailableStocks += game.quantity;
            totalAvailableValue += (game.quantity * game.price);
        }

        platformCounts[game.platform] = (platformCounts[game.platform] || 0) + game.quantity;

        // Placeholder for low stock logic (e.g., if quantity < 5)
        // if (game.quantity < 5 && !game.isSold) {
        //     lowStockItemsCount++;
        // }
    });

    totalAvailableValueEl.textContent = formatPhilippinePeso(totalAvailableValue);
    totalGamesInCollectionEl.textContent = totalGamesInCollection;
    soldItemsEl.textContent = totalSoldItems;
    totalSalesEl.textContent = formatPhilippinePeso(totalSalesValue);
    lowStockItemsEl.textContent = lowStockItemsCount;

    // Update Platform Distribution Chart
    const chartLabels = Object.keys(platformCounts);
    const chartData = Object.values(platformCounts);

    if (chartLabels.length > 0) {
        noChartDataMessage.classList.add('hidden');
        platformChartCanvas.style.display = 'block';
        if (platformChartInstance) {
            platformChartInstance.destroy();
        }

        const backgroundColors = [
            '#A78BFA', /* Purple */
            '#F472B6', /* Pink */
            '#FBBD23', /* Yellow/Orange */
            '#4ADE80', /* Green */
            '#EF4444', /* Red */
            '#3B82F6', /* Blue */
            '#6366F1', /* Indigo */
            '#EC4899', /* Rose */
            '#06B6D4'  /* Cyan */
        ];
        const borderColors = backgroundColors.map(color => color);

        platformChartInstance = new Chart(platformChartCanvas, {
            type: 'pie',
            data: {
                labels: chartLabels,
                datasets: [{
                    data: chartData,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#A0A0A0', /* Lighter gray for legend labels */
                            font: {
                                size: 12,
                                family: 'Inter'
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += context.parsed + ' games';
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    } else {
        if (platformChartInstance) {
            platformChartInstance.destroy();
            platformChartInstance = null;
        }
        platformChartCanvas.style.display = 'none';
        noChartDataMessage.classList.remove('hidden');
    }
}

/**
 * Filters and sorts the games array based on current criteria.
 * @returns {Array} The filtered and sorted games array.
 */
function getFilteredAndSortedGames() {
    const searchQuery = searchInput.value.toLowerCase();
    const selectedPlatform = platformFilter.value;
    const selectedStatus = statusFilter.value;
    const currentSortOption = sortOption.value;
    const currentSortOrder = sortOrder.value;

    let filteredGames = games.filter(game => {
        const matchesSearch = game.name.toLowerCase().includes(searchQuery);
        const matchesPlatform = selectedPlatform === 'All' || game.platform === selectedPlatform;
        const matchesStatus = selectedStatus === 'All' ||
                              (selectedStatus === 'Available' && !game.isSold) ||
                              (selectedStatus === 'Sold' && game.isSold);
        return matchesSearch && matchesPlatform && matchesStatus;
    });

    filteredGames.sort((a, b) => {
        let valA, valB;
        switch (currentSortOption) {
            case 'name':
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
                break;
            case 'price':
                valA = a.price;
                valB = b.price;
                break;
            case 'quantity':
                valA = a.quantity;
                valB = b.quantity;
                break;
            case 'dateAdded':
                valA = new Date(a.dateAdded);
                valB = new Date(b.dateAdded);
                break;
            default:
                return 0;
        }

        if (valA < valB) {
            return currentSortOrder === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
            return currentSortOrder === 'asc' ? 1 : -1;
        }
        return 0;
    });
    return filteredGames;
}

// --- Rendering Functions ---

/**
 * Renders games for the current page to the inventory list, applying filters and sorting.
 */
function renderGames() {
    inventoryList.innerHTML = '';

    const filteredAndSortedGames = getFilteredAndSortedGames();
    const totalGames = filteredAndSortedGames.length;
    const totalPages = Math.ceil(totalGames / gamesPerPage);

    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    } else if (totalPages === 0) {
        currentPage = 1;
    }

    const startIndex = (currentPage - 1) * gamesPerPage;
    const endIndex = startIndex + gamesPerPage;
    const gamesToRender = filteredAndSortedGames.slice(startIndex, endIndex);

    if (gamesToRender.length === 0) {
        noGamesMessage.classList.remove('hidden');
    } else {
        noGamesMessage.classList.add('hidden');
    }

    gamesToRender.forEach((game, index) => {
        const gameCard = document.createElement('div');
        gameCard.className = `game-card bg-white rounded-xl shadow-lg overflow-hidden flex flex-col animate-fadeIn ${game.isSold ? 'sold-item' : ''}`;
        gameCard.style.animationDelay = `${index * 0.05}s`;

        const imageUrl = game.photoUrl || `https://placehold.co/400x200/cccccc/333333?text=No+Image`;
        const imageHtml = `
            <div class="game-image-container">
                <img src="${imageUrl}" alt="${game.name}"
                     onerror="this.onerror=null; this.src='https://placehold.co/400x200/cccccc/333333?text=Image+Not+Found'; this.classList.add('image-placeholder-fallback');">
            </div>
        `;

        // Determine platform icon
        let platformIconClass = 'fas fa-gamepad'; // Default
        switch(game.platform) {
            case 'PlayStation 5':
            case 'PlayStation 4':
            case 'PlayStation 3':
                platformIconClass = 'fab fa-playstation';
                break;
            case 'Nintendo Switch':
            case 'Nintendo Wii U':
            case 'Nintendo 3DS':
                platformIconClass = 'fas fa-gamepad'; /* Font Awesome doesn't have specific Nintendo logo, using generic gamepad */
                break;
            case 'Xbox Series X':
            case 'Xbox One':
                platformIconClass = 'fab fa-xbox';
                break;
            case 'PC':
                platformIconClass = 'fas fa-desktop';
                break;
            default:
                platformIconClass = 'fas fa-gamepad';
        }

        gameCard.innerHTML = `
            ${imageHtml}
            <div class="p-6 flex-grow flex flex-col justify-between">
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-2">${game.name}</h3>
                    <p class="text-indigo-600 font-medium mb-1"><i class="${platformIconClass} mr-2"></i>${game.platform}</p>
                    <p class="text-gray-700 mb-1"><i class="fas fa-boxes mr-2"></i>Quantity: <span class="font-semibold">${game.quantity}</span></p>
                    <p class="text-green-600 text-lg font-bold mb-3"><i class="fas fa-peso-sign mr-1"></i>${formatPhilippinePeso(game.price).replace('₱', '')}</p>
                    ${game.description ? `<p class="text-gray-600 text-sm mt-2 line-clamp-3">${game.description}</p>` : ''}
                </div>
                <div class="mt-4 flex space-x-3">
                    <button data-id="${game.id}" class="edit-btn flex-1 px-4 py-2 bg-indigo-500 text-white rounded-full font-semibold text-sm hover:bg-indigo-600 transition duration-300 ease-in-out btn-secondary">
                        <i class="fas fa-edit mr-2"></i>Edit
                    </button>
                    <button data-id="${game.id}" class="delete-btn flex-1 px-4 py-2 bg-red-500 text-white rounded-full font-semibold text-sm hover:bg-red-600 transition duration-300 ease-in-out btn-danger">
                        <i class="fas fa-trash-alt mr-2"></i>Delete
                    </button>
                    <button data-id="${game.id}" class="toggle-sold-btn flex-1 px-4 py-2 ${game.isSold ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'} text-white rounded-full font-semibold text-sm transition duration-300 ease-in-out">
                        <i class="fas ${game.isSold ? 'fa-undo' : 'fa-hand-holding-dollar'} mr-2"></i>${game.isSold ? 'Mark Available' : 'Mark Sold'}
                    </button>
                </div>
            </div>
        `;
        inventoryList.appendChild(gameCard);
    });

    // Attach event listeners to newly rendered buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const id = event.currentTarget.dataset.id;
            editGame(id);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const id = event.currentTarget.dataset.id;
            confirmDelete(id);
        });
    });

    document.querySelectorAll('.toggle-sold-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const id = event.currentTarget.dataset.id;
            toggleSoldStatus(id);
        });
    });

    // Update pagination controls
    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;

    updateDashboard();
}

/**
 * Renders the activity history in the activity history modal.
 */
function renderActivityHistory() {
    activityLog.innerHTML = '';

    if (activityHistory.length === 0) {
        noActivityMessage.classList.remove('hidden');
        return;
    } else {
        noActivityMessage.classList.add('hidden');
    }

    const sortedHistory = [...activityHistory].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    sortedHistory.forEach(event => {
        const activityItem = document.createElement('div');
        activityItem.className = 'bg-gray-100 p-4 rounded-lg shadow-sm flex items-center space-x-3';

        let iconClass = '';
        let textColorClass = '';
        let actionText = '';

        switch (event.type) {
            case 'added':
                iconClass = 'fas fa-plus-circle text-green-500';
                textColorClass = 'text-green-700';
                actionText = 'added';
                break;
            case 'sold':
                iconClass = 'fas fa-tag text-red-500';
                textColorClass = 'text-red-700';
                actionText = 'marked as SOLD';
                break;
            case 'available':
                iconClass = 'fas fa-undo text-blue-500';
                textColorClass = 'text-blue-700';
                actionText = 'marked as AVAILABLE';
                break;
            case 'edited':
                iconClass = 'fas fa-edit text-yellow-500';
                textColorClass = 'text-yellow-700';
                actionText = 'edited';
                break;
            case 'deleted':
                iconClass = 'fas fa-trash-alt text-gray-500';
                textColorClass = 'text-gray-700';
                actionText = 'deleted';
                break;
            default:
                iconClass = 'fas fa-info-circle text-gray-400';
                textColorClass = 'text-gray-600';
                actionText = 'performed an action on';
        }

        const timestamp = new Date(event.timestamp).toLocaleString();

        activityItem.innerHTML = `
            <i class="${iconClass} text-xl"></i>
            <p class="text-gray-800">
                <span class="font-semibold ${textColorClass}">${event.gameName}</span> (${event.platform}) was <span class="font-semibold ${textColorClass}">${actionText}</span> on <span class="font-medium text-gray-600">${timestamp}</span>.
            </p>
        `;
        activityLog.appendChild(activityItem);
    });
}

/**
 * Populates the modal form with game data for editing.
 * @param {string} id - The ID of the game to edit.
 */
function editGame(id) {
    const game = games.find(g => g.id === id);
    if (game) {
        editingGameId = id;
        modalTitle.textContent = 'Edit Game';
        document.getElementById('gameName').value = game.name;
        document.getElementById('platform').value = game.platform;
        document.getElementById('quantity').value = game.quantity;
        document.getElementById('price').value = game.price;
        document.getElementById('description').value = game.description;

        photoFileInput.value = '';

        if (game.photoUrl) {
            imagePreview.src = game.photoUrl;
            imagePreviewContainer.classList.remove('hidden');
        } else {
            imagePreviewContainer.classList.add('hidden');
            imagePreview.src = '';
        }

        showModal(gameModal, gameModalContent);
    }
}

/**
 * Shows the confirmation modal for deleting a game.
 * @param {string} id - The ID of the game to delete.
 */
function confirmDelete(id) {
    gameToDeleteId = id;
    showModal(confirmationModal, confirmationModalContent);
}

// --- Initial Load ---
window.onload = () => {
    loadGamesFromLocalStorage();
    loadActivityHistoryFromLocalStorage();
};