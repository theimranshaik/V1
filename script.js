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
        // Check leads count and user status directly from Supabase
        const { data: leads, error } = await supabase
            .from('leads')
            .select('isPremium, subscriptionExpiry')
            .eq('user_id', userId)
            .limit(1);
            
        if (error) throw error;
        
        // Get user's premium status from the first lead record
        const userRecord = leads && leads.length > 0 ? leads[0] : null;
        const isPremium = userRecord ? userRecord.isPremium : false;
        const subscriptionExpiry = userRecord ? userRecord.subscriptionExpiry : null;
        
        // Count total leads for this user
        const { data: allLeads, error: countError } = await supabase
            .from('leads')
            .select('id')
            .eq('user_id', userId);
            
        if (countError) throw countError;
        
        const leadsCount = allLeads ? allLeads.length : 0;
        
        // Check conditions for redirect
        if (!isPremium && leadsCount >= 3) {
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

function proceedWithLeadCreation() {
    // Call the original openPopup function
    openPopup();
}
