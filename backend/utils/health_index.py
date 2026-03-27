def calculate_health_index(thyroid, pcos, iron):
    mapping = {"Low": 1, "Medium": 2, "High": 3}

    total = mapping[thyroid] + mapping[pcos] + mapping[iron]

    return (total / 9) * 100