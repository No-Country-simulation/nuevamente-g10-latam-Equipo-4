// Owns both startup and running resources so quit/account changes cannot orphan children.
export class LocalSession {
  current;
  startup;
  controller;
  cleanup=Promise.resolve();
  async start(factory) {
    if(this.startup)throw new Error('A inicialização local já está em andamento.');
    const controller=new AbortController();this.controller=controller;
    const operation=async()=>{
      await this.stopCurrent();controller.signal.throwIfAborted();
      const resource=await factory(controller.signal);
      if(controller.signal.aborted){await resource.stop();controller.signal.throwIfAborted();}
      this.current=resource;return resource;
    };
    const promise=operation();this.startup=promise;
    try{return await promise;}finally{this.startup=undefined;this.controller=undefined;}
  }
  async stopCurrent(){const current=this.current;this.current=undefined;if(current)this.cleanup=this.cleanup.then(()=>current.stop());await this.cleanup;}
  async stop(){this.controller?.abort();if(this.startup)await this.startup.catch(()=>undefined);await this.stopCurrent();}
}
