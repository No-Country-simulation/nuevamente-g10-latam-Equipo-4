export class UploadAdmission {
  private active?:object;
  reserve(){
    if(this.active)throw Object.assign(new Error('Outro arquivo está sendo processado. Aguarde.'),{status:429});
    const identity={};this.active=identity;
    let processing=false,closed=false;
    const finish=()=>{if(this.active===identity)this.active=undefined;};
    return {
      start(){if(closed)throw Object.assign(new Error('O envio foi interrompido.'),{status:400});processing=true;},
      close(){closed=true;if(!processing)finish();},
      finish,
    };
  }
}
