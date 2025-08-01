// Payment redirection logic
document.addEventListener('DOMContentLoaded', function() {
    // Check user status before allowing lead creation
    const addLeadButton = document.querySelector('button[onclick*="addLead"], button[onclick*="createLead"], #addLeadBtn, .add-lead-btn');
    
    if (addLeadButton) {
        addLeadButton.addEventListener('click', function(e) {
            e.preventDefault();
            checkUserStatusAndRedirect();
        });
    }
});

async function checkUserStatusAndRedirect() {
    try {
        // Get current user ID (you'll need to adjust this based on your auth setup)
        const userId = getCurrentUserId();
        
        if (!userId) {
            console.error('User not authenticated');
            return;
        }

        // Check user's subscription status
        const userStatus = await checkUserSubscription(userId);
        
        if (userStatus.shouldRedirect) {
            // Store intended action for after payment
            localStorage.setItem('intendedAction', 'addLead');
            window.location.href = 'payment.html';
            return;
        }
        
        // If no redirect needed, proceed with original lead creation
        proceedWithLeadCreation();
        
    } catch (error) {
        console.error('Error checking user status:', error);
        // Fallback: allow action to proceed
        proceedWithLeadCreation();
    }
}

async function checkUserSubscription(userId) {
    try {
        // Fetch user's leads count and subscription status
        const response = await fetch(`/api/user-status?userId=${userId}`);
        const data = await response.json();
        
        const isPremium = data.isPremium;
        const leadsCount = data.leadsCount;
        const subscriptionExpiry = data.subscriptionExpiry;
        
        // Check conditions for redirect
        if (!isPremium && leadsCount >= 30) {
            return { shouldRedirect: true, reason: 'free_user_limit' };
        }
        
        if (isPremium && subscriptionExpiry && new Date(subscriptionExpiry) <= new Date()) {
            return { shouldRedirect: true, reason: 'premium_expired' };
        }
        
        return { shouldRedirect: false };
        
    } catch (error) {
        console.error('Error fetching user status:', error);
        return { shouldRedirect: false };
    }
}

function getCurrentUserId() {
    // You'll need to implement this based on your authentication system
    // This could be from localStorage, session, or auth context
    return localStorage.getItem('userId') || sessionStorage.getItem('userId');
}

function proceedWithLeadCreation() {
    // This will be called if no redirect is needed
    // You can either call the original function or trigger the lead creation
    console.log('Proceeding with lead creation');
    // If you have an existing addLead function, call it here
    // addLead(); // Uncomment and adjust as needed
}
