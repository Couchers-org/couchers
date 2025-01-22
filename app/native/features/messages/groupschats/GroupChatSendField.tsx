import React from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { UseMutationResult } from 'react-query';
import { RpcError } from 'grpc-web';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';
import { usePersistedState } from 'platform/usePersistedState';
import { StyleSheet } from 'react-native';
import Button from '@/components/Button';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  textInput: {
    flex: 1,
    marginRight: 10,
  },
  buttonContainer: {
    width: 80,
  },
  button: {
    height: 50,
    marginTop: 4,
    marginBottom: 0,
  },
});


interface MessageFormData {
  text: string;
}

export interface GroupChatSendFieldProps {
  sendMutation: UseMutationResult<string | undefined | Empty, RpcError, string>;
  chatId: number;
  currentUserId: number;
}

export default function GroupChatSendField({
  sendMutation,
  chatId,
  currentUserId,
}: GroupChatSendFieldProps) {
  const { t } = useTranslation(['global', 'messages']);
  const { mutate: handleSend, isLoading } = sendMutation;

  const { control, handleSubmit, reset } = useForm<MessageFormData>();
  const [persistedMessage, setPersistedMessage, clearPersistedMessage] =
    usePersistedState(
      `messages.${currentUserId}.${chatId}`,
      '',
    );

  const onSubmit = handleSubmit(async (data: MessageFormData) => {
    handleSend(data.text.trimEnd());
    clearPersistedMessage();
    reset({ text: '' });
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inputContainer}>
        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              mode="outlined"
              label={t('messages:chat_input.label')}
              multiline
              maxLength={1000}
              onBlur={onBlur}
              onChangeText={(text) => {
                onChange(text);
                setPersistedMessage(text);
              }}
              value={value || persistedMessage}
              style={styles.textInput}
            />
          )}
          name="text"
          defaultValue=""
        />
        <Button
          title={t('global:send')}
          onPress={onSubmit}
          loading={isLoading}
          style={styles.button}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
