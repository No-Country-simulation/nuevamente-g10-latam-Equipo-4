from fastapi import APIRouter, Depends
from ..models import GroupInput, MessageInput
from . import service


def router(store, identity):
    routes = APIRouter(prefix="/v1/groups")

    @routes.get("")
    def groups(tenant=Depends(identity)):
        return store.groups(tenant)

    @routes.post("", status_code=201)
    def create(request: GroupInput, tenant=Depends(identity)):
        return service.create_group(store, tenant, request)

    @routes.get("/{group_id}/messages")
    def messages(group_id: str, tenant=Depends(identity)):
        return service.messages(store, tenant, group_id)

    @routes.post("/{group_id}/messages", status_code=201)
    def message(group_id: str, request: MessageInput, tenant=Depends(identity)):
        return service.send_message(store, tenant, group_id, request)

    return routes
