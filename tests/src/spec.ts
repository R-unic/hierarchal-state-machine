import { Assert, Fact } from "@rbxts/runit";
import { RunService as Runtime } from "@rbxts/services";

import HierarchalStateMachine from "../src/index";

const enum TestStateIDs {
  Test,
  TestSub,
  TestSub2
}

class TestState extends HierarchalStateMachine<TestStateIDs> {
  public readonly id = TestStateIDs.Test;
  public readonly subState = new TestSubState;
  public hasUpdated = false;

  public constructor() {
    super();
    this.loadSubState(this.subState);
  }

  protected onEnter(): void {

  }

  protected onUpdate(dt: number): void {
    this.hasUpdated = true;
  }

  protected onLeave(): void {

  }
}

class TestSubState extends HierarchalStateMachine<TestStateIDs> {
  public readonly id = TestStateIDs.TestSub;
  public hasUpdated = false;

  protected onEnter(): void {

  }

  protected onUpdate(dt: number): void {
    this.hasUpdated = true;
  }

  protected onLeave(): void {

  }
}

class TestSubState2 extends HierarchalStateMachine<TestStateIDs> {
  public readonly id = TestStateIDs.TestSub2;
  public hasUpdated = false;

  protected onEnter(): void {

  }

  protected onUpdate(dt: number): void {
    this.hasUpdated = true;
  }

  protected onLeave(): void {

  }
}

class HierarchalStateMachineTest {
  private readonly statesToUpdate: HierarchalStateMachine<TestStateIDs>[] = [];

  public constructor() {
    Runtime.Heartbeat.Connect(dt => {
      for (const state of this.statesToUpdate)
        state.update(dt);
    });
  }

  @Fact
  public updatesWhenEntered(): void {
    const state = this.createState();
    Assert.false(state.hasUpdated);
    state.enter();
    task.wait(1 / 15);
    Assert.true(state.hasUpdated);
  }

  @Fact
  public updatesSubStateWhenEntered(): void {
    const state = this.createState();
    Assert.false(state.subState.hasUpdated);
    state.enter();
    task.wait(1 / 15);
    Assert.true(state.subState.hasUpdated);
  }

  @Fact
  public enters(): void {
    const state = this.createState();
    Assert.false(state.isActive);
    state.enter();
    Assert.true(state.isActive);
  }

  @Fact
  public entersSubState(): void {
    const state = this.createState();
    Assert.false(state.subState.isActive);
    state.enter();
    Assert.true(state.subState.isActive);
  }

  @Fact
  public leaves(): void {
    const state = this.createState();
    state.enter();
    Assert.true(state.isActive);
    state.leave();
    Assert.false(state.isActive);
  }

  @Fact
  public leavesSubState(): void {
    const state = this.createState();
    state.enter();
    Assert.true(state.subState.isActive);
    state.leave();
    Assert.false(state.subState.isActive);
  }

  @Fact
  public transitionsCorrectly(): void {
    const state = this.createState();
    const { subState } = state;

    const secondSubState = new TestSubState2;
    state.loadSubState(secondSubState);
    state.addTransition(subState, secondSubState, 1);
    state.enter();
    Assert.true(subState.isActive);
    Assert.false(secondSubState.isActive);

    state.activateTrigger(1);
    Assert.false(subState.isActive);
    Assert.true(secondSubState.isActive);
  }

  private createState(): TestState {
    const state = new TestState;
    this.statesToUpdate.push(state);
    return state;
  }
}

export = HierarchalStateMachineTest;