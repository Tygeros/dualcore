def exp_to_next_level(level):
    if level in [0, 1]:
        return 10.0

    else:
        return exp_to_next_level(level - 2) + exp_to_next_level(level - 1)


def up_level(profile, bonus_exp):
    current_level = profile.level
    current_exp = profile.exp

    if bonus_exp < 0:
        return (current_level, current_exp + bonus_exp)

    ref_exp_threshold = exp_to_next_level(current_level)
    ref_exp = current_exp + bonus_exp
    ref_level = current_level

    while ref_exp >= ref_exp_threshold:
        ref_exp -= ref_exp_threshold
        ref_level += 1
        ref_exp_threshold = exp_to_next_level(ref_level)

    return (ref_level, ref_exp)
