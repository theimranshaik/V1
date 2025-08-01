// Payment redirection logic
document.addEventListener('DOMContentLoaded', function() {
    // Target the actual button in your HTML
    const addLeadButton = document.querySelector('button[onclick="openPopup()"]');
    
    if (addLeadButton) {
        addLeadButton.addEventListener('click', function(e) {
            e.preventDefault();
            checkUserStatusAndRedirect();
        });
    }
});

async function checkUserStatusAndRedirect() {
    try {
        // Get current user from Supabase
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            console.error('User not authenticated');
            return;
        }

        // Check user's subscription status
        const userStatus = await checkUserSubscription(user.id);
        
        if (userStatus.shouldRedirect) {
            localStorage.setItem('intendedAction', 'addLead');
            window.location.href = 'payment.html';
            return;
        }
        
        // If no redirect needed, proceed with original lead creation
        proceedWithLeadCreation();
        
    } catch (error) {
        console.error('Error checking user status:', error);
        proceedWithLeadCreation();
    }
}

async function checkUserSubscription(userId) {
    try {
        // Check leads count directly from Supabase
        const { data: leads, error } = await supabase
            .from('leads')
            .select('*')
            .eq('user_id', userId);
            
        if (error) throw error;
        
        const leadsCount = leads ? leads.length : 0;
        
        // For now, assume all users are free (you'll need to add isPremium column)
        const isPremium = false; // This should come from your database
        
        // Check conditions for redirect
        if (!isPremium && leadsCount >= 3) {
            return { shouldRedirect: true, reason: 'free_user_limit' };
        }
        
        return { shouldRedirect: false };
        
    } catch (error) {
        console.error('Error fetching user status:', error);
        return { shouldRedirect: false };
    }
}

function proceedWithLeadCreation() {
    // Call the original openPopup function
    openPopup();
}
