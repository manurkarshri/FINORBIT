# Physical Assets

Milestone 9 supports multiple properties, vehicles, and other valuables including gold, jewellery, equipment, collectibles, agricultural assets, and custom items. Every asset has a stable identity, optional loan relationship, explicit net-worth inclusion policy, dated opening value, and preserved manual valuation history.

Income and expense transactions can reference a physical asset without changing their accounting classification. This enables property income/expense and vehicle fuel/maintenance reporting. Insurance, service, property-tax, and maintenance dates remain attached to the asset and appear as upcoming schedules.

Asset sales use the existing balanced transaction engine, update destination cash and asset ownership effects, then atomically mark the sold asset archived while retaining its transaction and valuation history. Historical records never depend on mutable display names.
