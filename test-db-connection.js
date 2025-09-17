import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ozjhdxvwqbzcvcywhwjg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhkeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testDatabaseConnection() {
    console.log('Testing database connection...');

    try {
        // Test 1: Check if support_categories table exists and has data
        console.log('\n1. Testing support_categories table...');
        const { data: categories, error: categoriesError } = await supabase
            .from('support_categories')
            .select('*')
            .limit(5);

        if (categoriesError) {
            console.error('❌ Error loading categories:', categoriesError);
        } else {
            console.log('✅ Categories loaded successfully:', categories ? .length || 0, 'records');
            if (categories && categories.length > 0) {
                console.log('Sample category:', categories[0]);
            }
        }

        // Test 2: Check if support_tickets table exists
        console.log('\n2. Testing support_tickets table...');
        const { data: tickets, error: ticketsError } = await supabase
            .from('support_tickets')
            .select('*')
            .limit(1);

        if (ticketsError) {
            console.error('❌ Error accessing tickets table:', ticketsError);
        } else {
            console.log('✅ Tickets table accessible, records:', tickets ? .length || 0);
        }

        // Test 3: Check if support_ticket_messages table exists
        console.log('\n3. Testing support_ticket_messages table...');
        const { data: messages, error: messagesError } = await supabase
            .from('support_ticket_messages')
            .select('*')
            .limit(1);

        if (messagesError) {
            console.error('❌ Error accessing messages table:', messagesError);
        } else {
            console.log('✅ Messages table accessible, records:', messages ? .length || 0);
        }

        // Test 4: Try to create a test ticket
        console.log('\n4. Testing ticket creation...');
        const testTicketData = {
            ticket_number: `TEST-${Date.now()}`,
            category_id: categories && categories.length > 0 ? categories[0].id : null,
            email: 'test@example.com',
            subject: 'Test Ticket',
            description: 'This is a test ticket to verify database functionality',
            status: 'open',
            priority: 'medium',
            language: 'en'
        };

        if (!testTicketData.category_id) {
            console.error('❌ Cannot test ticket creation: No categories available');
        } else {
            const { data: testTicket, error: testTicketError } = await supabase
                .from('support_tickets')
                .insert([testTicketData])
                .select()
                .single();

            if (testTicketError) {
                console.error('❌ Error creating test ticket:', testTicketError);
            } else {
                console.log('✅ Test ticket created successfully:', testTicket.id);

                // Clean up: delete the test ticket
                await supabase
                    .from('support_tickets')
                    .delete()
                    .eq('id', testTicket.id);
                console.log('✅ Test ticket cleaned up');
            }
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

testDatabaseConnection();