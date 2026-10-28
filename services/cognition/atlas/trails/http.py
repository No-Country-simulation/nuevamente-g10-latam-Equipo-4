from fastapi import APIRouter, Depends
from ..models import Generation, StrictModel
from pydantic import Field
from . import service


class TrailInput(StrictModel):
    document_ids: list[str] = Field(min_length=1, max_length=8)
    goal: str = Field(min_length=3, max_length=2000)
    profile: Generation.model_fields["profile"].annotation = "beginner"
    agent_id: Generation.model_fields["agent_id"].annotation = "nilo"


class MaterialInput(StrictModel):
    package_id: str = Field(min_length=1, max_length=100)


def router(store, identity):
    routes = APIRouter(prefix="/v1/trails")

    @routes.get("")
    def listing(tenant=Depends(identity)):
        return service.list_trails(store, tenant)

    @routes.post("", status_code=201)
    def create(request: TrailInput, tenant=Depends(identity)):
        return service.create(store, tenant, request)

    @routes.get("/{trail_id}")
    def detail(trail_id: str, tenant=Depends(identity)):
        return service.get(store, tenant, trail_id)

    @routes.get("/{trail_id}/steps/{step_id}/input")
    def generation_input(trail_id: str, step_id: str, tenant=Depends(identity)):
        return service.generation_input(store, tenant, trail_id, step_id)

    @routes.post("/{trail_id}/steps/{step_id}/material")
    def attach(trail_id: str, step_id: str, request: MaterialInput, tenant=Depends(identity)):
        return service.attach(store, tenant, trail_id, step_id, request.package_id)

    @routes.post("/{trail_id}/steps/{step_id}/complete")
    def complete(trail_id: str, step_id: str, tenant=Depends(identity)):
        return service.complete(store, tenant, trail_id, step_id)

    return routes
