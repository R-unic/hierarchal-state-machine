interface Transition<StateID extends number = number> {
  readonly from: StateID;
  readonly to: StateID;
}

const enum Inlined {
  ErrorPrefix = "[@rbxts/hsm]: "
}

export default abstract class HierarchalStateMachine<StateID extends number = number, Trigger extends number = number> {
  public readonly isActive: boolean = false;

  private readonly subStates = new Map<StateID, HierarchalStateMachine<StateID>>;
  private readonly transitions = new Map<Trigger, Transition<StateID>>();
  private currentSubState?: HierarchalStateMachine<StateID>;
  private defaultSubState?: HierarchalStateMachine<StateID>;
  private parent?: HierarchalStateMachine<StateID>;

  public abstract readonly id: StateID;
  protected abstract onEnter(): void;
  protected abstract onUpdate(dt: number): void;
  protected abstract onLeave(): void;

  public constructor(
    private readonly reportError = (message: string) => { throw Inlined.ErrorPrefix + message; },
    private readonly reportWarning = (message: string) => warn(Inlined.ErrorPrefix + message),
  ) { }

  public enter(): void {
    (this as Writable<this>).isActive = true;
    this.onEnter();
    if (this.currentSubState === undefined && this.defaultSubState !== undefined)
      this.currentSubState = this.defaultSubState;

    this.currentSubState?.enter();
  }

  public update(dt: number): void {
    if (!this.isActive) return;
    this.onUpdate(dt);
    this.currentSubState?.update(dt);
  }

  public leave(): void {
    (this as Writable<this>).isActive = false;
    this.currentSubState?.leave();
    this.onLeave();
  }

  public loadSubState(subState: HierarchalStateMachine<StateID>): void {
    if (this.subStates.size() === 0)
      this.defaultSubState = subState;

    if (subState.parent !== undefined)
      return this.reportError(`Sub-state "${subState.id}" already has a parent.`);

    subState.parent = this;

    if (!this.subStates.has(subState.id))
      this.subStates.set(subState.id, subState);
    else
      this.reportError(`State "${this.id}" already contains a sub-state of ID "${subState.id}"`);
  }

  public addTransition(from: HierarchalStateMachine<StateID>, to: HierarchalStateMachine<StateID>, trigger: Trigger): void {
    if (!this.subStates.has(from.id))
      return this.reportError(`State "${this.id}" does not have a sub-state of type "${from.id}" to transition from`);
    if (!this.subStates.has(to.id))
      return this.reportError(`State "${this.id}" does not have a sub-state of type "${to.id}" to transition to`);

    if (!this.transitions.has(trigger))
      this.transitions.set(trigger, { from: from.id, to: to.id });
    else
      this.reportError(`Trigger "${trigger}" already has a transition defined in state "${this.id}"`);
  }

  public activateTrigger(trigger: Trigger): void {
    let currentState: HierarchalStateMachine | undefined = this;

    while (currentState !== undefined) {
      if (!currentState.transitions.has(trigger)) {
        currentState = currentState.parent;
        continue;
      }

      const transition = currentState.transitions.get(trigger)!;
      if (currentState.currentSubState?.id !== transition.from)
        return this.reportError(`${currentState.id}'s current substate is not "${transition.from}"`);
      if (!currentState.subStates.has(transition.to))
        return this.reportError(`${currentState.id} has no substate of type "${transition.to}"`);

      const toState = currentState.subStates.get(transition.to)!;
      return currentState.changeSubState(toState);
    }

    this.reportError(`Trigger ${trigger} not found in any state hierarchy`);
  }

  private changeSubState(state: HierarchalStateMachine<StateID>): void {
    const newState = this.subStates.get(state.id)!;
    if (this.currentSubState === newState)
      return this.reportWarning(`${this.id} is already in ${this.id} substate`);

    this.currentSubState?.leave();
    this.currentSubState = newState;
    newState.enter();
  }
}