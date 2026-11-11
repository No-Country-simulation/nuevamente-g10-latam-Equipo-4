import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {connection} from 'next/server';

export async function redirectWithoutSession(){
  await connection();
  if(process.env.ATLAS_REQUIRE_LOGIN==='1' && !(await cookies()).get('atlas_session')?.value){
    redirect('/login');
  }
}
