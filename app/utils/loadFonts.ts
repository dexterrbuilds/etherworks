import * as Font from 'expo-font';

export async function loadFonts() {
  await Font.loadAsync({
    'Satoshi-Regular': require('../../assets/fonts/Satoshi-Regular.otf'),
    'Satoshi-Medium': require('../../assets/fonts/Satoshi-Medium.otf'),
    'Satoshi-Bold': require('../../assets/fonts/Satoshi-Bold.otf'),
  });
}

