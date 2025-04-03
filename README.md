# @rbxts/hsm

### Hierarchal State Machine
Create states with sub-states. You can also define transitions for specific triggers.

```ts
const enum TestStateIDs {
  Test,
  TestSub,
}

class TestState extends HierarchalStateMachine<TestStateIDs> {
  public readonly id = TestStateIDs.Test;
  public readonly subState = new TestSubState;

  public constructor() {
    super();
    this.loadSubState(this.subState);
  }

  protected onEnter(): void {
    print("entered main state")
  }

  protected onUpdate(dt: number): void {
    
  }

  protected onLeave(): void {
    print("left main state")
  }
}

class TestSubState extends HierarchalStateMachine<TestStateIDs> {
  public readonly id = TestStateIDs.TestSub;

  protected onEnter(): void {
    print("entered sub-state")
  }

  protected onUpdate(dt: number): void {
    
  }

  protected onLeave(): void {
    print("left sub-state")
  }
}

const state = new TestState;
state.enter();
state.leave();
RunService.Heartbeat.Connect(dt => state.update(dt));
```