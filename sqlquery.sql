-- Create the leads table with user authentication support
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  number TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('New', 'FollowUp', 'Interested', 'Not Interested', 'Customer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create policy to ensure users can only see their own leads
CREATE POLICY "Users can only access their own leads" ON leads
  FOR ALL USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);

-- Create function to automatically set updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_leads_updated_at 
  BEFORE UPDATE ON leads 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- updated
-- Add premium tier columns to the leads table
ALTER TABLE leads 
ADD COLUMN isPremium BOOLEAN DEFAULT FALSE,
ADD COLUMN subscriptionExpiry TIMESTAMP WITH TIME ZONE;

-- Create index for premium users for better query performance
CREATE INDEX idx_leads_is_premium ON leads(isPremium);
CREATE INDEX idx_leads_subscription_expiry ON leads(subscriptionExpiry);

-- Optional: Create a function to check if a user's subscription is active
CREATE OR REPLACE FUNCTION is_subscription_active(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM leads 
    WHERE user_id = user_uuid 
    AND isPremium = TRUE 
    AND (subscriptionExpiry IS NULL OR subscriptionExpiry > NOW())
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;