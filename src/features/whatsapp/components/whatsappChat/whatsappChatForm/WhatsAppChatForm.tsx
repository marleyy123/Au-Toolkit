import React from 'react';
import { WhatsAppChatData, CharacterPreset } from '../../../../../types';
import { CharacterSelector, SaveProfileButton } from '../../../../../components/FormControls';
import { WhatsAppChatHeaderSettings } from './WhatsAppChatHeaderSettings';
import { WhatsAppChatThemeSettings } from './WhatsAppChatThemeSettings';
import { WhatsAppChatMessagesEditor } from './WhatsAppChatMessagesEditor';
interface Props {
  data: WhatsAppChatData;
  onChange: (updated: WhatsAppChatData) => void;
  characters: CharacterPreset[];
  activeCharacterId?: string;
  onSaveCharacter: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter: (char: CharacterPreset) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const WhatsAppChatForm: React.FC<Props> = ({
  data,
  onChange,
  characters,
  activeCharacterId,
  onSaveCharacter,
  onSaveProfile,
  onSelectCharacter,
  onDeleteCharacter,
  onRenameCharacter,
}) => {
  return (
    <div className="space-y-4 text-slate-800">
      {/* Quick AU Character Presets */}
      <CharacterSelector
        characters={characters}
        activeCharacterId={activeCharacterId}
        onSelect={onSelectCharacter}
        onSaveCurrent={onSaveCharacter}
        onDeleteCharacter={onDeleteCharacter}
        onRenameCharacter={onRenameCharacter}
        addLabel="+ Add Folder"
      />

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <WhatsAppChatHeaderSettings data={data} onChange={onChange} />
        <WhatsAppChatThemeSettings data={data} onChange={onChange} />
      </div>
      <WhatsAppChatMessagesEditor data={data} onChange={onChange} />
      <SaveProfileButton onSave={onSaveProfile} />
    </div>
  );
};
