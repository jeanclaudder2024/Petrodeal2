import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing')

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupAdmin() {
  console.log('Setting up admin user...')
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('❌ No authenticated user found. Please log in first.')
      return
    }
    
    console.log(`Current user: ${user.email} (${user.id})`)
    
    // Check if user_roles table exists and insert admin role
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (existingRole) {
      console.log(`✅ User already has role: ${existingRole.role}`)
      
      // Update to super_admin if not already
      if (existingRole.role !== 'super_admin') {
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ role: 'super_admin' })
          .eq('user_id', user.id)
        
        if (updateError) {
          console.log('❌ Error updating role:', updateError)
        } else {
          console.log('✅ Updated role to super_admin')
        }
      }
    } else {
      // Insert new admin role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'super_admin'
        })
      
      if (insertError) {
        console.log('❌ Error inserting admin role:', insertError)
      } else {
        console.log('✅ Added super_admin role to user')
      }
    }
    
    // Test admin access to tickets
    console.log('\nTesting admin access to tickets...')
    const { data: tickets, error: ticketsError } = await supabase
      .from('support_tickets')
      .select('*')
    
    if (ticketsError) {
      console.log('❌ Error accessing tickets:', ticketsError)
    } else {
      console.log(`✅ Admin can access ${tickets.length} tickets`)
    }
    
  } catch (error) {
    console.log('❌ Error:', error)
  }
}

setupAdmin()