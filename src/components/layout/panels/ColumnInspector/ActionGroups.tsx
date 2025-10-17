import { ColumnProfile } from '../../../../core/profiling/columnTypes';
import { GeneralGroup } from './ActionGroups/GeneralGroup';
import { TextGroup } from './ActionGroups/TextGroup';
import { NumericGroup } from './ActionGroups/NumericGroup';
import { BooleanGroup } from './ActionGroups/BooleanGroup';
import { CategoryGroup } from './ActionGroups/CategoryGroup';
import { DateTimeGroup } from './ActionGroups/DateTimeGroup';
import { ConstantGroup } from './ActionGroups/ConstantGroup';
import styles from './ActionGroups.module.css';

interface ActionGroupsProps {
  profile: ColumnProfile;
}

export function ActionGroups({ profile }: ActionGroupsProps) {
  return (
    <div className={styles.actionGroups}>
      <GeneralGroup profile={profile} />
      {profile.type === 'numeric' && <NumericGroup profile={profile} />}
      {profile.type === 'text' && <TextGroup profile={profile} />}
      {profile.type === 'boolean' && <BooleanGroup profile={profile} />}
      {profile.type === 'categorical' && <CategoryGroup profile={profile} />}
      {profile.type === 'datetime' && <DateTimeGroup profile={profile} />}
      {profile.type === 'constant' && <ConstantGroup profile={profile} />}
    </div>
  );
}