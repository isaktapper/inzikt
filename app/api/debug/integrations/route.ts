import { NextResponse } from 'next/server';
import { adminSupabase } from '@/utils/supabase/server';

// This API route is for debugging integration issues
export async function GET(request: Request) {
  try {
    // Check if the user is authenticated
    const headersList = request.headers;
    const authorization = headersList.get('authorization');
    let userId = null;
    
    if (authorization && authorization.startsWith('Bearer ')) {
      const token = authorization.split(' ')[1];
      const { data: tokenData, error: tokenError } = await adminSupabase.auth.getUser(token);
      
      if (tokenData?.user) {
        userId = tokenData.user.id;
        console.log('Found user from token:', userId);
      } else {
        return NextResponse.json(
          { error: 'Authentication required', tokenError },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Authentication required - no bearer token' },
        { status: 401 }
      );
    }

    // Get the connection for all providers
    const { data: connections, error: connectionsError } = await adminSupabase
      .from('integration_connections')
      .select('*')
      .eq('user_id', userId);
    
    // Get import configs
    const { data: importConfigs, error: importConfigsError } = await adminSupabase
      .from('integration_import_configs')
      .select('*')
      .eq('user_id', userId);

    // Return debug info
    return NextResponse.json({
      success: true,
      userId,
      connections_count: connections?.length || 0,
      connections: connections || [],
      connections_error: connectionsError,
      import_configs_count: importConfigs?.length || 0,
      import_configs: importConfigs || [],
      import_configs_error: importConfigsError,
      tables_info: {
        integration_connections: connections ? true : false,
        integration_import_configs: importConfigs ? true : false
      }
    });
    
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Debug endpoint error', details: error },
      { status: 500 }
    );
  }
} 